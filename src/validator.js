var validator = function () {

    var self = this;

    self.PropertyRule = function (propertyName, rules, friendlyName) {
        var self = this;
        self.PropertyName = propertyName;
        self.Rules = rules;
        if (friendlyName != null)
            self.FriendlyName = friendlyName;
        else
            self.FriendlyName = propertyName;
    };

    self.ValidateModel = function (model, propertyRuleItems, modelPropertyName) {
        if (model == null) model = '';
        var validationResults = {};
        for (var i = 0; i < propertyRuleItems.length; i++) {
            var propertyRuleItem = propertyRuleItems[i];
            if (modelPropertyName == null || propertyRuleItem.PropertyName == modelPropertyName) {
                // setup validation results object
                validationResults[propertyRuleItem.PropertyName] = { errors: [], isValid: true };
                var propertyValidationResults = validationResults[propertyRuleItem.PropertyName];
                // calculate property path in model, if necessary
                var m = model;
                if (modelPropertyName == null) {
                    var ruleProperties = propertyRuleItem.PropertyName.split('.');
                    var ruleProperty = '';
                    for (var j = 0; j < ruleProperties.length; j++) {
                        ruleProperty = ruleProperties[j];
                        m = m[ruleProperty];
                    }
                }
                // if the model property value happens to be an array, just take the first item - not ideal but will do for now
                if (Object.prototype.toString.call(m) == '[object Array]') {
                    if (m.length > 0)
                        m = m[0];
                    else
                        m = '';
                }
                // perform validation for this propertyRuleItem on m
                var propertyRuleList = propertyRuleItem.Rules;
                var shortCircuit = false;
                for (var k = 0; k < propertyRuleList.length; k++) {
                    if (!shortCircuit) {
                        var ruleType = propertyRuleList[k]; // actual rule object in rule array for property
                        if (!ruleType.ruleParams.hasOwnProperty('ruleIsActive')) {
                            ruleType.ruleParams.ruleIsActive = function () {
                                return true;
                            }
                        }
                        if (ruleType.ruleParams.ruleIsActive()) {
                            if (!ruleType.ruleParams.hasOwnProperty('shortCircuit'))
                                ruleType.ruleParams.shortCircuit = false;
                            if (ruleType.ruleName != 'custom') {
                                var rule = rules[ruleType.ruleName];
                                var params = null;
                                if (ruleType.ruleParams.hasOwnProperty('params'))
                                    params = ruleType.ruleParams.params;
                                var validationResult = rule.validator(m, params);
                                if (!validationResult) {
                                    var errorMessage = getMessage(propertyRuleItem.PropertyName, ruleProperty, propertyRuleItem.FriendlyName, ruleType.ruleParams, rule.message);
                                    var error = { property: propertyRuleItem.PropertyName, errorMessage: errorMessage };
                                    propertyValidationResults.errors.push(error);
                                    shortCircuit = ruleType.ruleParams.shortCircuit;
                                }

                            }
                            else {
                                var validator = ruleType.ruleParams.validator;
                                var value = null;
                                if (ruleType.ruleParams.hasOwnProperty('params')) {
                                    value = ruleType.ruleParams.params;
                                }
                                var result = validator(m, value());
                                if (result != true) {
                                    var errorMessage = getMessage(propertyRuleItem.PropertyName, ruleProperty, propertyRuleItem.FriendlyName, ruleType.ruleParams, 'Invalid value.');
                                    var error = { property: propertyRuleItem.PropertyName, errorMessage: errorMessage };
                                    propertyValidationResults.errors.push(error);
                                    shortCircuit = ruleType.ruleParams.shortCircuit;
                                }
                            }
                        }
                    }
                }
                propertyValidationResults.isValid = (propertyValidationResults.errors.length == 0);
            }
        }

        return validationResults;
    }

    self.ConsolidateErrors = function (validationResultsArray) {
        var validationErrors = [];
        for (var i = 0; i < validationResultsArray.length; i++) {
            var validationResults = validationResultsArray[i];
            if (validationResults != null) {
                var props = Object.keys(validationResults);
                for (var j = 0; j < props.length; j++) {
                    var propertyValidationResults = validationResults[props[j]];
                    if (propertyValidationResults.errors != null) {
                        propertyValidationResults.errors.forEach(function (propertyError) {
                            validationErrors.push(propertyError);
                        });
                    }
                }
            }
        }
        return validationErrors;
    }

    var getMessage = function (propertyPath, propertyName, friendlyName, ruleParams, defaultMessage) {
        var message = '';
        if (ruleParams.hasOwnProperty('message')) {
            message = ruleParams.message;
            if (propertyPath == propertyName)
                message = message.replace('_PATH_', '')

            message = message.replace('_PATH_', propertyPath);
            message = message.replace('_PROPERTY_', propertyName);
            message = message.replace('_FRIENDLY_', friendlyName);
        }
        else
            message = propertyName + ': ' + defaultMessage;
        return message;
    }

    var rules = [];

    rules['required'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            return !(value.toString().trim() == '');
        },
        message: 'Value is required.'
    };
    rules['minLength'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            if (value == '')
                return true;
            return !(value.trim().length < params);
        },
        message: 'Value does not meet minimum length.'
    };
    rules['maxLength'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            if (value == '')
                return true;
            return !(value.trim().length > params);
        },
        message: 'Value exceeds maximum length.'
    };
    rules['pattern'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            if (value == '')
                return true;
            var regExp = new RegExp(params);
            return !(regExp.exec(value.trim()) == null);
        },
        message: 'Value must match regular expression.'
    };
    rules['email'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            if (value == '')
                return true;
            var emailPattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
            var regExp = new RegExp(emailPattern);
            return !(regExp.exec(value.trim()) == null);
        },
        message: 'Value is not a valid email.'
    };
    rules['url'] = {
        validator: function (value, params) {
            if (value == null) value = '';
            if (value == '')
                return true;
            var urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
            var regExp = new RegExp(urlPattern);
            return !(regExp.exec(value.trim()) == null);
        },
        message: 'Value is not a valid URL.'
    };
    rules['minValue'] = {
        validator: function (value, params) {
            return !isNaN(value) && !(Number(value) < params);
        },
        message: 'Value is less than minimum.'
    };
    rules['maxValue'] = {
        validator: function (value, params) {
            return !isNaN(value) && !(Number(value) > params);
        },
        message: 'Value exceeds allowed maximum.'
    };

    return this;
};
