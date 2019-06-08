define([
    "jquery",
    "setServiceLabel",
    "overlay",
    "resetAllMessages",
    "showErrorMessage",
    'mage/translate'
], function ($, setServiceLabel, overlay, resetAllMessages, showErrorMessage) {
    return function (config, serviceStatus, isAlreadyConfigured) {

        let loggingOptions = {
            id: 'fastly-logging-options',
            title: jQuery.mage.__(' '),
            content: function () {
                return document.getElementById('fastly-logging-template').textContent;
            },
            actionOk: function () {
            }
        };
    }
});