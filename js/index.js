import Router from "./paramHashRouter.js";
import Routes from "./routes.js";

import DropdownMenuControl from "./dropdownMenuControl.js";

window.drMenuCntrl = new DropdownMenuControl("menuIts", "menuTitle", "mnShow");

window.router = new Router(Routes,"welcome");



