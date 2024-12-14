import Router from "./paramHashRouter.js";
import Routes from "./routes.js";

import DropdownMenuControl from "./dropdownMenuControl.js";

window.drMenuCntrl = new DropdownMenuControl("menuIts", "menuTitle", "mnShow");

window.router = new Router(Routes, "welcome");

// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Event delegation: Listen for clicks on any element with the 'back-button' class
  document.addEventListener('click', function (e) {
    if (e.target.closest('.back-button')) {
      e.preventDefault(); // Prevent the default anchor behavior
      window.history.back(); // Navigate to the previous page in history
    }
  });
});



