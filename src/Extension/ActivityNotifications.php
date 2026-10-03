<?php

namespace Mundophpbb\Plugin\System\ActivityNotifications\Extension;

defined('_JEXEC') or die;

use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\CMS\Uri\Uri;

final class ActivityNotifications extends CMSPlugin
{
    protected $autoloadLanguage = true;

    public function onBeforeCompileHead(): void
    {
        $app = $this->getApplication();

        if (!$app->isClient('site')) {
            return;
        }

        $identity = $app->getIdentity();
        if (!$identity || $identity->guest) {
            return;
        }

        $document = $app->getDocument();
        if (!$document || $document->getType() !== 'html') {
            return;
        }

        $document->addScriptOptions('plg_system_activitynotifications', [
            'apiBase' => Uri::root(true) . '/index.php?option=com_sociable',
            'refreshInterval' => max(10, min(300, (int) $this->params->get('refresh_interval', 20))),
            'showToast' => (bool) $this->params->get('show_toast', 1),
            'commentsOnly' => (bool) $this->params->get('comments_only', 0),
            'strings' => [
                'comment' => (string) \Joomla\CMS\Language\Text::_('PLG_SYSTEM_ACTIVITYNOTIFICATIONS_COMMENT'),
                'reply' => (string) \Joomla\CMS\Language\Text::_('PLG_SYSTEM_ACTIVITYNOTIFICATIONS_REPLY'),
                'someone' => (string) \Joomla\CMS\Language\Text::_('PLG_SYSTEM_ACTIVITYNOTIFICATIONS_SOMEONE'),
                'newNotification' => (string) \Joomla\CMS\Language\Text::_('PLG_SYSTEM_ACTIVITYNOTIFICATIONS_NEW'),
            ],
        ]);

        $wa = $document->getWebAssetManager();
        $wa->registerAndUseScript(
            'plg_system_activitynotifications.live',
            'plg_system_activitynotifications/js/activitynotifications.js',
            ['version' => 'auto'],
            ['defer' => true]
        );
    }
}
