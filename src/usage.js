var person = function (firstName, lastName, age, zipCode) {
    
    var self = this;

    self.firstName = firstName;
    self.lastName = lastName;
    self.age = age;
    self.zipCode = zipCode;

    return this;
}

var testFunction = function (validator) {  // injected anyway you want

    var person1 = new person('Miguel', 'Castro', 50);
    var person2 = new person('John', 'Doe', 36);
    var person3 = new person('Jane', 'Doe', 16);

    var personRules = [
        new validator.PropertyRule('firstName', {
            required: { message: 'First Name is required' }
        }),
        new validator.PropertyRule('lastName', {
            required: { message: 'Last Name is required' }
        }),
        new validator.PropertyRule('age', {
            required: { message: 'Age is required' },
            minValue: { message: 'Person is not an adult', params: 21 }
        }),
        new validator.PropertyRule('zipCode', {
            required: { message: 'Zip Code is required' },
            pattern: { message: 'Zip Code is invalid', params: /^\d{5}$/ }
        }),
    ];

    var submit = function () {
        
        var person1ValResults = validator.ValidateModel(person1, personRules);
        var person2ValResults = validator.ValidateModel(person2, personRules);
        var person3ValResults = validator.ValidateModel(person3, personRules);
        
        var validationResults = validator.ConsolidateErrors([
            person1ValResults, person2ValResults, person3ValResults
        ])
    }
}
