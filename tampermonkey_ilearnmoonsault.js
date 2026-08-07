// ==UserScript==
// @name         iLearn Moonsault
// @namespace    https://github.com/zoebogner/iLearn-Moonsault
// @version      2026-08-07.0
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

    /** Styling to reduce promenence of the 'Course Completion Detail' menu item. */
    const style = document.createElement('style');
    style.innerHTML = `
        #ctl00_ucAdminNavBar_rptParentNodes_ctl16_rptChildNodes_ctl02_lbtnChildNode {
            color: #8fcbfe !important;            /* Muted grey text */
            font-weight: normal !important;        /* Standard weight */
        }

        #ctl00_ucAdminNavBar_rptParentNodes_ctl16_rptChildNodes_ctl02_lbtnChildNode:hover {
            color: #f3f3f3 !important;            /* Darken text on hover for accessibility */
        }
    `;
    document.head.appendChild(style);

    /** Add useful training plan, profile, registration links */
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

    
    /** Rename report downloads to include their report type and datestamp */
    
    const downloadBtn = document.querySelector('#ctl00_cphDefaultContent_btnDownload');
    const reportNameLabel = document.querySelector('#ctl00_cphDefaultContent_lblReportName');

    if (!downloadBtn || !reportNameLabel) {
        return;
    }

    function getDateStamp() {
        const d = new Date();
        return (
            d.getFullYear().toString() +
            String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0')
        );
    }

    function sanitiseFilename(name) {
        return name
            .replace(/[<>:"/\\|?*]+/g, '')
            .replace(/\s+/g, '_')
            .trim();
    }

    downloadBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        try {
            const reportName = sanitiseFilename(reportNameLabel.textContent);

            const form = document.querySelector('form');
            const formData = new FormData(form);

            formData.set(
                'ctl00$cphDefaultContent$btnDownload',
                'Download'
            );

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let extension = 'xlsx';

            const disposition = response.headers.get('content-disposition');
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/i);
                if (match) {
                    const originalName = match[1];
                    const extMatch = originalName.match(/\.([^.]+)$/);
                    if (extMatch) {
                        extension = extMatch[1];
                    }
                }
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const filename =
                `${reportName}_${getDateStamp()}.${extension}`;

            GM_download({
                url: blobUrl,
                name: filename,
                saveAs: false
            });

            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        } catch (err) {
            console.error('Failed to rename download:', err);

            // Fallback to normal behaviour
            HTMLInputElement.prototype.click.call(downloadBtn);
        }
    }, true);
})();
