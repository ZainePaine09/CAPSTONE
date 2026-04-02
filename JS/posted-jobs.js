(function () {
    const STORAGE_KEY = 'postedJobsData';
    const API_URL = '/server/php/posted_jobs.php';

    const FALLBACK_JOBS = [
        {
            title: 'Software Developer',
            company: 'TechCorp Inc.',
            location: 'Makati City'
        },
        {
            title: 'Marketing Specialist',
            company: 'Bright Ideas Co.',
            location: 'Cebu City'
        },
        {
            title: 'IT Support Technician',
            company: 'Metro IT Solutions',
            location: 'Quezon City'
        },
        {
            title: 'Graphic Designer',
            company: 'Creative Minds Studio',
            location: 'Davao City'
        },
        {
            title: 'Finance Analyst',
            company: 'ExcelBank',
            location: 'Makati City'
        }
    ];

    let postedJobsCache = [];

    function safeParseJson(value, fallback = null) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function flattenJobsData(rawData) {
        if (!rawData) {
            return [];
        }

        if (Array.isArray(rawData)) {
            return rawData;
        }

        if (typeof rawData === 'object') {
            return Object.keys(rawData).reduce((all, dateKey) => {
                const jobs = Array.isArray(rawData[dateKey]) ? rawData[dateKey] : [];
                return all.concat(jobs);
            }, []);
        }

        return [];
    }

    function cacheJobs(jobs) {
        postedJobsCache = Array.isArray(jobs) ? jobs : [];
        const grouped = postedJobsCache.reduce((groups, job) => {
            const dateKey = job.postedDate || new Date().toISOString().split('T')[0];
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(job);
            return groups;
        }, {});

        localStorage.setItem(STORAGE_KEY, JSON.stringify(grouped));
    }

    function renderPostedJobs() {
        const grid = document.getElementById('postedJobsGrid');
        if (!grid) {
            return;
        }

        const jobs = postedJobsCache.length > 0 ? postedJobsCache : FALLBACK_JOBS;

        if (!jobs.length) {
            grid.innerHTML = '<div class="posted-jobs-empty">No posted jobs available right now.</div>';
            return;
        }

        grid.innerHTML = jobs.map(job => `
            <article class="posted-job-card">
                <h3>${job.title}</h3>
                <p class="posted-job-meta"><strong>Company:</strong> ${job.company}</p>
                <p class="posted-job-meta"><strong>Location:</strong> ${job.location}</p>
                <div class="posted-job-actions">
                    <button class="posted-job-action applicants" type="button">View Applicants</button>
                </div>
            </article>
        `).join('');
    }

    function syncJobBoardView() {
        const selector = document.getElementById('postedJobsFilter');
        const postedPanel = document.getElementById('postedJobsPanel');
        const aiSection = document.querySelector('.ai-recommendations');
        const aiInsights = document.querySelector('.career-insights');

        if (!selector || !postedPanel) {
            return;
        }

        const showPostedJobs = selector.value === 'posted';
        postedPanel.hidden = !showPostedJobs;

        if (aiSection) {
            aiSection.hidden = showPostedJobs;
        }

        if (aiInsights) {
            aiInsights.hidden = showPostedJobs;
        }

        if (showPostedJobs) {
            renderPostedJobs();
        }
    }

    async function loadPostedJobs() {
        const cachedJobs = flattenJobsData(safeParseJson(localStorage.getItem(STORAGE_KEY), null));

        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                cache: 'no-cache'
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
                    cacheJobs(data.jobs);
                    return;
                }
            }
        } catch (error) {
            console.warn('Posted jobs fetch failed:', error);
        }

        if (cachedJobs.length > 0) {
            cacheJobs(cachedJobs);
            return;
        }

        cacheJobs(FALLBACK_JOBS);
    }

    document.addEventListener('DOMContentLoaded', async function () {
        await loadPostedJobs();
        renderPostedJobs();

        const selector = document.getElementById('postedJobsFilter');
        if (selector) {
            selector.addEventListener('change', syncJobBoardView);
            syncJobBoardView();
        }

        window.addEventListener('storage', function(event) {
            if (event.key === STORAGE_KEY) {
                const data = safeParseJson(event.newValue, {});
                cacheJobs(flattenJobsData(data));
                renderPostedJobs();
                syncJobBoardView();
            }
        });
    });
})();
