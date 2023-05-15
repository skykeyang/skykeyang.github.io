// Function for deriving age based on current date

function calculate_age(dob) { 
    var diff_ms = Date.now() - dob.getTime();
    var age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

var currentAge = calculate_age(new Date(1998, 1, 24));
var age_element = document.getElementById("age");
age_element.innerText = currentAge;
console.log(age_element.innerText);

