import Skill from "./classes/Skill.js";

// UPDATE SKILLS BY ADDING ITEM TO ARRAY
var skillsArray = [["Python", "80"],["Javascript", "70"],["Selenium","60"],["SQL", "50"],["PHP", "70"],["CSS", "70"],["Solidity", "30"],["Golang", "10"],["AWS", "40"]];
var objSkillsArray = [];

skillsArray.forEach(convertToClass);
console.log(objSkillsArray);
var skillCol1 = document.getElementById("skills-col-1");
var skillCol2 = document.getElementById("skills-col-2");

for (let i = 0; i < objSkillsArray.length; i++) {
    var div = objSkillsArray[i].createSkillDiv();
    console.log(div);
    if (i%2 == 0) {
        skillCol1.appendChild(div);
    }
    else if (i%2 != 0) {
        skillCol2.appendChild(div);
    }
}

function convertToClass(item, index) {
    objSkillsArray.push(new Skill(item[0],item[1]));
}