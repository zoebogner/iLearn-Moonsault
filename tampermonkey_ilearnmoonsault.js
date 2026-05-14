// ==UserScript==
// @name         iLearn Moonsault
// @namespace    https://github.com/zoebogner/iLearn-Moonsault
// @version      2026-05-14.2
// @description  Tools and shortcuts for iLearn Agency Admins
// @author       Zoe Bogner
// @match        *://ilearn.sahealth.sa.gov.au/*
// @match        *://ilearnext.sahealth.sa.gov.au/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zoebogner/iLearn-Moonsault/refs/heads/main/tampermonkey_ilearnmoonsault.js
// @downloadURL  https://raw.githubusercontent.com/zoebogner/iLearn-Moonsault/refs/heads/main/tampermonkey_ilearnmoonsault.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function getUserIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('uid') || params.get('userid');
    }

    function insertLinks() {
        const userSpan = document.querySelector('#ctl00_cphDefaultContent_lblvwUserName');
        if (!userSpan) return;

        const userId = getUserIdFromUrl();
        if (!userId) return;

        // Prevent duplicates
        if (document.getElementById('tm-links-container')) return;

        const baseUrl = window.location.origin;
        const currentUrl = window.location.href;

        const container = document.createElement('div');
        container.id = 'tm-links-container';
        container.style.marginTop = '5px';

        const baseStyle = `
            display: block;
            font-size: 12px;
            margin-top: 3px;
        `;

        // Profile link
        const profileLink = document.createElement('a');
        profileLink.href = `${baseUrl}/Worldlearn/Modules/UserManagement/UserViewEdit.aspx?userid=${userId}`;
        profileLink.textContent = 'View Profile';
        profileLink.style.cssText = baseStyle;
        //profileLink.target = '_blank';

        // Registration Status link
        const regLink = document.createElement('a');
        regLink.href = `${baseUrl}/Worldlearn/Modules/RegistrationManagement/CourseRegistrationList.aspx?uid=${userId}&user=`;
        regLink.textContent = 'View Registrations';
        regLink.style.cssText = baseStyle;
        //regLink.target = '_blank';

        // Training Plan link
        const tpLink = document.createElement('a');
        tpLink.href = `${baseUrl}/Worldlearn/Modules/PlanManagement/TrainingPlan.aspx?uid=${userId}&b=0`;
        tpLink.textContent = 'View Training Plan';
        tpLink.style.cssText = baseStyle;
        //tpLink.target = '_blank';

        // --- TRAINING PLAN PAGE ---
        if (currentUrl.includes('TrainingPlan.aspx')) {
            container.appendChild(profileLink);
            container.appendChild(regLink);
        }

        // --- REGISTRATION PAGE ---
        if (currentUrl.includes('CourseRegistrationList.aspx')) {
            container.appendChild(profileLink);
            container.appendChild(tpLink);
        }

        // --- USER PROFILE PAGE ---
        if (currentUrl.includes('UserViewEdit.aspx')) {
            container.appendChild(tpLink);
            container.appendChild(regLink);
        }

        userSpan.parentElement.appendChild(container);
    }

    insertLinks();

    const observer = new MutationObserver(() => {
        insertLinks();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

})();
