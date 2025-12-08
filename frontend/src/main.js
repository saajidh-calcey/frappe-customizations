import { createApp } from 'vue';
import Survey from './Survey.vue';

// Define the ID where we expect to mount the app
const MOUNT_POINT_ID = 'vue-survey-mount-point';

function mountSurveyApp() {
    const mountPoint = document.getElementById(MOUNT_POINT_ID);
    
    if (mountPoint) {
        // Clean up existing instance if any (hot reload safety)
        if (mountPoint.__vue_app__) {
            mountPoint.__vue_app__.unmount();
        }
        
        const app = createApp(Survey);
        app.mount(mountPoint);
    } else {
        console.error(`Survey App: Could not find mount point #${MOUNT_POINT_ID}`);
    }
}

// Expose the mount function globally so the Frappe Page can call it
window.mountSurveyApp = mountSurveyApp;