frappe.pages['survey'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Survey',
		single_column: true
	});

    // 1. Create the Container with the specific ID expected by main.js
    $(page.main).html('<div id="vue-survey-mount-point">Loading Survey...</div>');

    // Define the path to our compiled bundle
    // Note the path starts after 'public'
    const bundlePath = "/assets/customizations/js/survey.bundle.js";

    // 2 & 3. Load Vue global, then load our bundle
    // We load Vue from Frappe's node_modules to ensure compatibility
    frappe.require([
        "assets/frappe/node_modules/vue/dist/vue.global.prod.js",
        bundlePath
    ], function() {
        // 4. Once scripts are loaded, call the mount function exposed in main.js
        // if (window.mountSurveyApp) {
        //      // Clear loading message
        //      $('#vue-survey-mount-point').empty();
        //      // Mount the Vue app
        //      window.mountSurveyApp();
        // } else {
        //      frappe.msgprint("Error loading survey application bundle.");
        // }
    });
}