(function () {
    'use strict';

    var options = (window.Joomla && Joomla.getOptions)
        ? Joomla.getOptions('plg_system_activitynotifications', {})
        : {};

    var apiBase = options.apiBase || '/index.php?option=com_sociable';
    var interval = Math.max(10, Number(options.refreshInterval || 20)) * 1000;
    var showToast = options.showToast !== false;
    var commentsOnly = options.commentsOnly === true;
    var strings = options.strings || {};
    var lastTopId = 0;
    var initialised = false;
    var busy = false;

    function escapeHtml(value) {
        var div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function apiUrl(task, params) {
        var url = apiBase + '&task=notifications.' + encodeURIComponent(task) + '&format=json';
        Object.keys(params || {}).forEach(function (key) {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }
        });
        return url;
    }

    function getJson(task, params) {
        return fetch(apiUrl(task, params), {
            method: 'GET',
            credentials: 'same-origin',
            headers: {'X-Requested-With': 'XMLHttpRequest'},
            cache: 'no-store'
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (json) {
            if (json && json.success === false) throw new Error(json.message || 'API error');
            return json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
        });
    }

    function notificationUrl(item) {
        var data = item.data || {};
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) { data = {}; }
        }
        if (data.action_url) return data.action_url;
        if (data.url) return data.url;

        var activityId = Number(data.activity_id || (item.target_type === 'activity' ? item.target_id : 0));
        var root = apiBase.split('/index.php')[0] || '';
        var feed = root + '/index.php?option=com_sociable&view=feed';
        if (activityId > 0) return feed + '#/activity/' + activityId;
        return feed + '#/notifications';
    }

    function messageFor(item) {
        var actor = item.actor_name || item.actor_handle || strings.someone || 'Someone';
        var type = item.notification_type || '';
        if (type === 'comment') return actor + ' ' + (strings.comment || 'commented on your post');
        if (type === 'reply') return actor + ' ' + (strings.reply || 'replied to your comment');
        return item.content ? actor + ' ' + item.content : (strings.newNotification || 'New notification');
    }

    function timeAgo(dateString) {
        if (!dateString) return '';
        var stamp = Date.parse(String(dateString).replace(' ', 'T') + (String(dateString).indexOf('Z') === -1 ? 'Z' : ''));
        if (isNaN(stamp)) stamp = Date.parse(dateString);
        var seconds = Math.max(0, Math.floor((Date.now() - stamp) / 1000));
        if (seconds < 60) return 'agora';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' h';
        return Math.floor(seconds / 86400) + ' d';
    }

    function icon(type) {
        if (type === 'comment' || type === 'reply') {
            return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>';
        }
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
    }

    function updateBadge(wrapper, count) {
        var trigger = wrapper.querySelector('.snot-trigger');
        if (!trigger) return;
        var badge = trigger.querySelector('.snot-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'snot-badge';
                trigger.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : String(count);
            badge.setAttribute('aria-label', count + ' unread');
        } else if (badge) {
            badge.remove();
        }
        var headerBadge = wrapper.querySelector('.snot-header__badge');
        if (headerBadge) {
            if (count > 0) {
                headerBadge.textContent = count > 99 ? '99+' : String(count);
                headerBadge.style.display = '';
            } else {
                headerBadge.style.display = 'none';
            }
        }
    }

    function renderList(wrapper, items) {
        var panel = wrapper.querySelector('.snot-panel');
        if (!panel) return;
        var oldList = panel.querySelector('.snot-list');
        var empty = panel.querySelector('.snot-empty');

        if (!items.length) {
            if (oldList) oldList.remove();
            if (empty) empty.style.display = '';
            return;
        }
        if (empty) empty.style.display = 'none';

        var list = oldList || document.createElement('ul');
        list.className = 'snot-list';
        list.setAttribute('role', 'list');
        list.innerHTML = items.map(function (item) {
            var type = item.notification_type || 'default';
            var unread = !(item.read_at || Number(item.is_read) === 1);
            return '<li class="snot-item' + (unread ? ' snot-item--unread' : '') + '" role="listitem">' +
                '<a href="' + escapeHtml(notificationUrl(item)) + '" class="snot-item__link">' +
                '<span class="snot-icon snot-icon--' + escapeHtml(type) + '" aria-hidden="true">' + icon(type) + '</span>' +
                '<div class="snot-body"><p class="snot-msg">' + escapeHtml(messageFor(item)) + '</p>' +
                '<span class="snot-time">' + escapeHtml(timeAgo(item.created || '')) + '</span></div>' +
                '<span class="snot-dot' + (unread ? '' : ' snot-dot--hidden') + '" aria-hidden="true"></span>' +
                '</a></li>';
        }).join('');

        if (!oldList) {
            var footer = panel.querySelector('.snot-footer');
            panel.insertBefore(list, footer || null);
        }
    }

    function toast(item) {
        if (!showToast) return;
        if (commentsOnly && ['comment', 'reply'].indexOf(item.notification_type) === -1) return;

        var existing = document.getElementById('sociable-live-notification-toast');
        if (existing) existing.remove();

        var box = document.createElement('a');
        box.id = 'sociable-live-notification-toast';
        box.href = notificationUrl(item);
        box.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:2147483000;max-width:360px;padding:14px 16px;border-radius:12px;background:#fff;color:#111827;box-shadow:0 12px 36px rgba(0,0,0,.22);border:1px solid #e5e7eb;text-decoration:none;font:inherit;display:block;';
        box.innerHTML = '<strong style="display:block;margin-bottom:3px">' + escapeHtml(strings.newNotification || 'Nova notificação') + '</strong>' +
            '<span style="font-size:.9rem">' + escapeHtml(messageFor(item)) + '</span>';
        document.body.appendChild(box);
        setTimeout(function () { if (box.parentNode) box.remove(); }, 7000);
    }

    function refresh() {
        if (busy || document.hidden) return;
        var wrappers = document.querySelectorAll('.mod-sociable-notifications');
        if (!wrappers.length) return;
        busy = true;

        Promise.all([
            getJson('getUnreadCount'),
            getJson('list', {page: 1, limit: 10})
        ]).then(function (values) {
            var count = Number((values[0] && values[0].count) || 0);
            var payload = values[1] || {};
            var items = Array.isArray(payload.items) ? payload.items : [];

            wrappers.forEach(function (wrapper) {
                updateBadge(wrapper, count);
                renderList(wrapper, items);
            });

            var topId = items.length ? Number(items[0].id || 0) : 0;
            if (initialised && topId > lastTopId) {
                for (var i = items.length - 1; i >= 0; i--) {
                    var id = Number(items[i].id || 0);
                    if (id > lastTopId) {
                        toast(items[i]);
                        break;
                    }
                }
            }
            if (topId > lastTopId) lastTopId = topId;
            initialised = true;
        }).catch(function () {
            // Silent by design: the normal Sociable module keeps working.
        }).finally(function () {
            busy = false;
        });
    }

    function start() {
        refresh();
        window.setInterval(refresh, interval);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) refresh();
        });
        window.addEventListener('focus', refresh);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, {once: true});
    } else {
        start();
    }
}());
