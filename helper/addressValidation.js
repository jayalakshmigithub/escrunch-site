document.addEventListener('DOMContentLoaded', function () {
  const addressForm = document.getElementById('addaddressform');
  const addressInput = document.querySelector('input[name="address"]');
  const addressError = document.getElementById('address-error');
  const cityInput = document.querySelector('input[name="city"]');
  const cityError = document.getElementById('city-error');
  const stateInput = document.querySelector('input[name="state"]');
  const stateError = document.getElementById('state-error');
  const pincodeInput = document.querySelector('input[name="pincode"]');
  const pincodeError = document.getElementById('pincode-error');

  addressForm.addEventListener('submit', function (event) {
    let hasError = false;

    if (!isValidAddress(addressInput.value)) {
      addressError.textContent = 'Invalid address input';
      addressError.style.display = 'block';
      hasError = true;
    } else {
      addressError.style.display = 'none';
    }

    if (!isValidCity(cityInput.value)) {
      cityError.textContent = 'Invalid city input';
      cityError.style.display = 'block';
      hasError = true;
    } else {
      cityError.style.display = 'none';
    }

    if (!isValidState(stateInput.value)) {
      stateError.textContent = 'Invalid state input';
      stateError.style.display = 'block';
      hasError = true;
    } else {
      stateError.style.display = 'none';
    }

    if (!isValidPincode(pincodeInput.value)) {
      pincodeError.textContent = 'Invalid pincode input';
      pincodeError.style.display = 'block';
      hasError = true;
    } else {
      pincodeError.style.display = 'none';
    }

    if (hasError===true) {
      event.preventDefault(); // Prevent form submission
    }
  });
});

function isValidAddress(address) {
  // Implement your validation logic for address
  return /^(?!\s*$)[\w\s\d!@#$%^&*(),.?":{}|<>_-]+$/.test(address);
}

function isValidCity(city) {
  // Implement your validation logic for city
  return /^[A-Z][a-zA-Z]*$/.test(city);
}

function isValidState(state) {
  // Implement your validation logic for state
  const validIndianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
    'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Delhi', 'Puducherry'
  ];
  return state.trim() !== '' && validIndianStates.includes(state);
}

function isValidPincode(pincode) {
  // Implement your validation logic for pincode
  const validPincodePattern = /^\d{6}$/;
  if (!validPincodePattern.test(pincode)) {
    return false;
  }
  for (let i = 0; i <= 9; i++) {
    if (pincode.indexOf(i.toString().repeat(6)) !== -1) {
      return false;
    }
  }
  return pincode.trim() !== '';
}
