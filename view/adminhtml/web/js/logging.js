define([
    "jquery",
    "setServiceLabel",
    "overlay",
    "resetAllMessages",
    "showErrorMessage",
    'mage/translate'
], function ($, setServiceLabel, overlay, resetAllMessages, showErrorMessage) {
    return function (config, serviceStatus, isAlreadyConfigured) {

        let successLoggingBtnMsg = $('#fastly-success-logging-button-msg');
        let errorLoggingBtnMsg = $('#fastly-error-logging-button-msg');
        let msgWarning = $('.fastly-message-error');
        let conditions;
        let conditionName = null;
        let applyIf = null;
        let conditionPriority = null;
        let conditionModal;
        let backends;
        let endpointConfigStatus;

        let active_version = serviceStatus.active_version;

        let loggingOptions = {
            id: 'fastly-logging-options',
            title: jQuery.mage.__(' '),
            content: function () {
                return document.getElementById('fastly-logging-template').textContent;
            },
            actionOk: function () {
                createLoggingEndpoint(active_version, true)
            }
        };

        let createConditionOptions = {
            title: jQuery.mage.__('Create a new request condition'),
            content: function () {
                return document.getElementById('fastly-create-condition-template').textContent;
            },
            actionOk: function () {
                createCondition();
            },
        };

        $('#fastly_logging').on('click', function () {
            if (isAlreadyConfigured !== true) {
                $(this).attr('disabled', true);
                return alert($.mage.__('Please save config prior to continuing.'));
            }

            resetAllMessages();

            $.ajax({
                type: "GET",
                url: config.serviceInfoUrl,
                showLoader: true
            }).done(function (service) {
                if (service.status === false) {
                    return errorLoggingBtnMsg.text($.mage.__('Please check your Service ID and API token and try again.')).show();
                }

                active_version = service.active_version;
                getBackends(active_version).done(function (resp) {
                    if (resp !== false) {
                        if (resp.backends.length > 0) {
                            backends = resp.backends;
                        }
                    }
                });

                getLoggingEndpoint(active_version, true).done(function (response) {
                    overlay(loggingOptions);
                    let deleteBtn = $('<button class="action-secondary" id="fastly_logging_delete_btn" type="button" data-role="action"></button>');
                    deleteBtn.append($('<span>Delete</span>'));
                    $('.modal-header').find(".page-actions-buttons").append(deleteBtn);
                    $('.modal-title').text($.mage.__('Configure logging endpoint'));
                    $('.upload-button span').text('Save');
                    $('#conditions').hide();
                    $('#detach').hide();
                    $('#create-condition').hide();
                    $('#sep').hide();
                    let backendHtml = '';
                    let endpointConfig = response.endpoint_config;
                    endpointConfigStatus = response.status;
                    $.each(backends, function (index, backend) {
                        backendHtml += '<option value="'+backend.hostname+'"';
                        let backendHostname = 'https://' + backend.hostname;
                        if (endpointConfigStatus !== 'false' && endpointConfig.url === backendHostname) {
                            backendHtml += 'selected="selected"'
                        }
                        backendHtml += '>'+backend.name+' ('+backend.hostname+')</option>';
                    });
                    $('#backends').html(backendHtml);
                });
            });
        });

        $('body').on('click', 'button#fastly_logging_delete_btn', function () {
            resetAllMessages();
            deleteLoggingEndpoint(active_version, true).done(function (response) {
                if (response.status === true) {
                    active_version = response.active_version;
                    modal.modal('closeModal');
                    successLoggingBtnMsg.text($.mage.__('Logging endpoint successfully deleted.')).show();
                } else {
                    showErrorMessage($.mage.__('Could not delete logging endpoint'));
                }
            })
        });

        $('body').on('click', '#attach', function () {
            getAllConditions(active_version, true).done(function (response) {
                let html = '';
                $('#attach_span').hide();
                if (response !== false) {
                    conditions = response.conditions;
                    html += '<option value="">no condition</option>';
                    $.each(conditions, function (index, condition) {
                        if (condition.type === "REQUEST") {
                            html += '<option value="'+condition.name+'">'+condition.name+' ('+condition.type+') '+condition.statement+'</option>';
                        }
                    });
                }
                $('#conditions').show();
                $('#detach').show();
                $('#create-condition').show();
                $('#sep').show();
                $('#conditions').html(html);
            })
        });

        $('body').on('click', '#detach', function () {
            $('#conditions').html('');
            $('#conditions').hide();
            $('#detach').hide();
            $('#sep').hide();
            $('#create-condition').hide();
            $('#attach_span').show();
        });

        $('body').on('click', '#create-condition', function () {
            overlay(createConditionOptions);
            conditionModal = modal;
            $('.upload-button span').text('Create');
        });

        function getLoggingEndpoint(active_version, loaderVisibility)
        {
            return $.ajax({
                type: "POST",
                url: config.getLoggingEndpointUrl,
                showLoader: loaderVisibility,
                data: {
                    'active_version': active_version
                }
            });
        }

        function getBackends(active_version)
        {
            return $.ajax({
                type: "GET",
                url: config.fetchBackendsUrl,
                showLoader: true,
                data: {'active_version': active_version},
                async: false
            });
        }

        function deleteLoggingEndpoint(active_version, loaderVisibility)
        {
            return $.ajax({
                type: "POST",
                url: config.deleteLoggingEndpointUrl,
                showLoader: loaderVisibility,
                data: {
                    'active_version': active_version
                }
            });
        }

        function createLoggingEndpoint(active_version, loaderVisibility)
        {
            $.ajax({
                type: "POST",
                url: config.createLoggingEndpointUrl,
                showLoader: loaderVisibility,
                data: {
                    'active_version': active_version,
                    'backend': $('#backends').val(),
                    'condition': $('#conditions').val(),
                    'endpoint_status': endpointConfigStatus
                },
                success: function (response) {
                    if (response.status === true) {
                        $('#fastly-success-logging-button-msg').text($.mage.__('Logging endpoint successfully configured')).show();
                        modal.modal('closeModal');
                    } else {
                        resetAllMessages();
                        showErrorMessage(response.msg);
                    }
                }
            });
        }

        function getAllConditions(active_version, loaderVisibility)
        {
            return $.ajax({
                type: "GET",
                url: config.getAllConditionsUrl,
                showLoader: loaderVisibility,
                data: {'active_version': active_version}
            });
        }

        function createCondition()
        {
            conditionName = $('#condition_name').val();
            applyIf = $('#apply_if').val();
            conditionPriority = $('#condition_priority').val();
            if (applyIf.length > 512) {
                showErrorMessage('The expression cannot contain more than 512 characters.');
                return;
            } else if (applyIf.length < 1 || conditionName.length < 1) {
                showErrorMessage('Please fill in the required fields.');
                return;
            } else if (isNaN(parseInt(conditionPriority))) {
                showErrorMessage('Priority value must be an integer.');
                return;
            }
            let html = '';
            html += '<option value="">no condition</option>';
            $.each(conditions, function (index, condition) {
                if (condition.type === "REQUEST") {
                    html += '<option value="'+condition.name+'">'+condition.name+' ('+condition.type+') '+condition.statement+'</option>';
                }
            });
            $('#conditions').html(html);
            $('#conditions').append('<option value="'+conditionName+'" selected="selected">'+conditionName+' (REQUEST) '+applyIf+'</option>');
            conditionModal.modal('closeModal');
            msgWarning.hide();
        }

    }
});