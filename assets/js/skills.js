// Template div
// <div class="progress">
//     <span class="skill">HTML <i class="val">100%</i></span>
//         <div class="progress-bar-wrap">
//             <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
//         </div>
// </div>

class Skill {
    constructor(name,proficiency) {
        this.name = name;
        this.proficiency = proficiency;
    }

    createSkillDiv() {
        var div1 = document.createElement('div');
        div1.setAttribute("class", "progress");

        var span = document.createElement('span');
        span.setAttribute("class","skill");
        span.innerHTML = this.name + "<i class='val'>100%</i>";

        var div2 = document.createElement('div');
        div2.setAttribute("class", "progress-bar-wrap");

        var div3 = document.createElement('div');
        div3.setAttribute("class","progress-bar");
        div3.setAttribute("role", "progressbar");
        div3.setAttribute("aria-valuenow",this.proficiency);
        div3.setAttribute("aria-valuemin", "0");
        div3.setAttribute("aria-valuemax", "100");

        div1.appendChild(span);
        div2.appendChild(div3);
        div1.appendChild(div2);
        
        return div1
    }
}

console.log(new Skill("Python", "100%"));