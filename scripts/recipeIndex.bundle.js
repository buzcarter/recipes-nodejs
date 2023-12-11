(()=>{"use strict";const e="RecipeNodeJs",t=Object.freeze({RECENT:"recent",SEARCH:"search",SEARCH_HISTORY:"searchHistory",VIEW:"content"}),c=t=>localStorage.setItem(e,JSON.stringify(t));function n(){let t=localStorage.getItem(e);return t=t&&JSON.parse(t),t||(t={},c(t)),t}const o=(e,t)=>{const o=n();o[e]=t,c(o)},r=(e,t)=>{const c=n()[e];return void 0===c?t:c},s={RECIPE_LIST:"#recipe-list",RECENTLY_VIEWED_BTN:"#show-recents-btn",MODAL:"#show-recents-modal",MODAL_CONTENT:"#show-recents-content",MODAL_CLOST_BTN:"#show-recents-close-btn"},i={MODAL_ACTIVE:"modal--is-active"};function l(e){const c="A"===e.target.tagName?e.target:e.target.closest("a");if(c){const e=c.getAttribute("href");e&&((e,t,c)=>{let n=r(e,[]);const s=n.indexOf(c);0!==s&&(s>-1&&n.splice(s,1),n.unshift(c),n.length>t&&(n=n.slice(0,t)),o(e,n))})(t.RECENT,50,e.replace(/^.*\/|\.html$/g,""))}}function a(e){const t=document.querySelector(s.MODAL);t.classList.toggle(i.MODAL_ACTIVE,e),t.setAttribute("aria-hidden",!e)}function u(){a(!0),document.querySelector(s.MODAL_CONTENT).innerHTML=r(t.RECENT).map((e=>`<li><a href="${e}.html">${(e=>e.replace(/-/g," ").replace(/\w\S*/g,(e=>e.charAt(0).toUpperCase()+e.substr(1).toLowerCase())).replace(/\s+/g," ").trim())(e)}</a></li>`)).join("")}const d="recipe-list__item--hidden",E="#recipe-list",m="#recipe-list li",L="#filter-field",f="#clear-filter-btn",S=27,h=e=>e.trim().toLowerCase().replace(/\W/g,"").replace(/\s+/g," ");function T(e){const t=e.split(/\s+/).map((e=>h(e))).filter(Boolean);document.querySelectorAll(m).forEach((c=>{e||c.classList.remove(d);const{searchText:n}=c.dataset||"",o=t.reduce(((e,t)=>e&&n.includes(t)),!0);c.classList.toggle(d,!o)}))}const p=()=>{const e=document.querySelector(L);e.value="",e.focus(),T(""),o(t.SEARCH,"")},y=Object.freeze(["content","compact-list","grid"]),A=".js-view-radio-btn";function g(e){y.forEach((e=>document.body.classList.remove(`view--${e}`))),document.body.classList.add(`view--${e}`)}function C(){const{view:e}=this.dataset;o(t.VIEW,e),g(e)}!function(){const e=r(t.VIEW,"content");var c;!function(e){const c=document.querySelector(E);c.style.opacity="0",document.querySelectorAll(m).forEach((e=>e.dataset.searchText=h(e.innerText)));const n=document.querySelector(L);n.value=e||"",T(e),c.style.opacity="100%",n.addEventListener("keyup",(function(){o(t.SEARCH,this.value),T(this.value)})),n.addEventListener("keydown",(e=>e.which===S&&p())),document.querySelector(f).addEventListener("click",p)}(r(t.SEARCH,"")),c=e,document.querySelectorAll(A).forEach((e=>e.addEventListener("click",C))),g(c),document.querySelector(s.RECENTLY_VIEWED_BTN).addEventListener("click",u),document.querySelector(s.RECIPE_LIST).addEventListener("click",l),document.querySelector(s.MODAL_CLOST_BTN).addEventListener("click",(()=>a(!1)))}()})();
//# sourceMappingURL=recipeIndex.bundle.js.map