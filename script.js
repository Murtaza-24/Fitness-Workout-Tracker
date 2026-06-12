document.addEventListener('DOMContentLoaded', () => {

    // --- Hardcoded Exercise Database ---
    const exerciseDB = [
        { name: "Bench Press", type: "Strength" },
        { name: "Squat", type: "Strength" },
        { name: "Deadlift", type: "Strength" },
        { name: "Overhead Press", type: "Strength" },
        { name: "Pull-up", type: "Strength" },
        { name: "Barbell Row", type: "Strength" },
        { name: "Bicep Curl", type: "Strength" },
        { name: "Tricep Extension", type: "Strength" },
        { name: "Running", type: "Cardio" },
        { name: "Cycling", type: "Cardio" },
        { name: "Rowing", type: "Cardio" },
        { name: "Jump Rope", type: "HIIT" },
        { name: "Burpees", type: "HIIT" },
        { name: "Kettlebell Swings", type: "HIIT" },
        { name: "Yoga Routine", type: "Flexibility" },
        { name: "Dynamic Stretching", type: "Flexibility" }
    ];

    // --- State ---
    let workouts = JSON.parse(localStorage.getItem('forge_workouts')) || [];
    let currentWorkout = { type: '', date: '', duration: 45, exercises: [] };

    // --- Seed Data (If empty) ---
    if (workouts.length === 0) {
        workouts = generateSeedData();
        saveWorkouts();
    }

    function generateSeedData() {
        const seed = [];
        const types = ["Strength", "Cardio", "HIIT", "Strength"];
        let today = new Date();
        
        // Generate workouts over last 8 weeks
        for (let i = 0; i < 40; i++) {
            let d = new Date(today);
            d.setDate(d.getDate() - Math.floor(Math.random() * 56)); // Random day in last 56 days
            
            let wType = types[Math.floor(Math.random() * types.length)];
            let duration = Math.floor(Math.random() * 30) + 30; // 30-60 mins
            
            let exCount = Math.floor(Math.random() * 3) + 3;
            let exercises = [];
            let volume = 0;

            for(let j=0; j<exCount; j++) {
                let sets = [];
                for(let s=0; s<3; s++) {
                    let weight = Math.floor(Math.random() * 100) + 50;
                    let reps = Math.floor(Math.random() * 5) + 8;
                    sets.push({ reps, weight });
                    if(wType === 'Strength') volume += (weight * reps);
                }
                exercises.push({ name: `Exercise ${j+1}`, sets });
            }

            seed.push({
                id: Date.now() + i,
                date: d.toISOString().split('T')[0],
                type: wType,
                duration: duration,
                volume: volume,
                exercises: exercises
            });
        }
        return seed.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function saveWorkouts() {
        localStorage.setItem('forge_workouts', JSON.stringify(workouts));
    }

    // --- Navigation Logic ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');

    function switchView(targetId) {
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        navItems.forEach(n => n.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(n => n.classList.add('active'));

        if (targetId === 'view-dashboard') renderDashboard();
        if (targetId === 'view-history') renderHistory();
        if (targetId === 'view-progress') renderProgress();
    }

    navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(nav.getAttribute('data-target'));
        });
    });

    document.getElementById('navAddWorkout').addEventListener('click', () => initWizard());
    document.getElementById('mobileAddWorkout').addEventListener('click', () => initWizard());

    // --- Date Helpers ---
    const getDatesOfCurrentWeek = () => {
        let curr = new Date();
        let week = [];
        let first = curr.getDate() - curr.getDay(); // Sunday
        for (let i = 0; i < 7; i++) {
            let day = new Date(curr.setDate(first + i));
            week.push(day.toISOString().split('T')[0]);
        }
        return week;
    };

    // --- Dashboard Rendering ---
    function renderDashboard() {
        const today = new Date();
        const past7Days = new Date(today);
        past7Days.setDate(past7Days.getDate() - 7);
        
        let recentWorkouts = workouts.filter(w => new Date(w.date) >= past7Days);
        
        // Stats
        document.getElementById('statDaysActive').textContent = new Set(recentWorkouts.map(w => w.date)).size;
        document.getElementById('statDuration').textContent = recentWorkouts.reduce((sum, w) => sum + parseInt(w.duration), 0);
        document.getElementById('statCalories').textContent = recentWorkouts.reduce((sum, w) => sum + (parseInt(w.duration) * 8), 0); // Rough estimate

        // Calendar Strip
        const weekDates = getDatesOfCurrentWeek();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const stripHtml = weekDates.map((date, idx) => {
            const hasWorkout = workouts.some(w => w.date === date);
            const isToday = date === new Date().toISOString().split('T')[0];
            const activeClass = hasWorkout ? 'active' : '';
            return `
                <div class="cal-day">
                    <span style="${isToday ? 'color:var(--accent)' : ''}">${days[idx]}</span>
                    <div class="cal-dot ${activeClass}">${new Date(date).getDate()}</div>
                </div>
            `;
        }).join('');
        document.getElementById('calendarStrip').innerHTML = stripHtml;

        // Recent List
        renderHistoryList(workouts.slice(0, 3), 'dashboardRecentList');
    }

    // --- History Rendering ---
    function renderHistory() {
        renderHistoryList(workouts, 'fullHistoryList');
    }

    function renderHistoryList(data, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = data.map(w => {
            const exListHtml = w.exercises.map(ex => {
                const setsDesc = ex.sets.length > 0 && ex.sets[0].weight ? 
                    `${ex.sets.length} sets` : `${ex.sets.length > 0 ? ex.sets[0].duration : 0} mins`;
                return `<li><span class="hist-ex-name">${ex.name}</span> <span class="hist-ex-sets">${setsDesc}</span></li>`;
            }).join('');

            return `
                <div class="history-item" onclick="this.classList.toggle('expanded')">
                    <div class="hist-header">
                        <div class="hist-title">
                            <span class="hist-type-badge">${w.type}</span>
                            ${w.date}
                        </div>
                        <div class="hist-meta">
                            ${w.duration} min • ${w.exercises.length} Exercises
                        </div>
                    </div>
                    <div class="hist-details">
                        <ul class="hist-ex-list">
                            ${exListHtml}
                        </ul>
                        ${w.volume > 0 ? `<p style="margin-top:12px;color:var(--accent);">Volume: ${w.volume} lbs</p>` : ''}
                    </div>
                </div>
            `;
        }).join('') || '<p style="color:var(--text-muted)">No workouts logged yet.</p>';
    }

    // --- Progress (SVG Charts) ---
    function renderProgress() {
        // Group data by week for the last 8 weeks
        let weeksData = Array(8).fill().map(() => ({ freq: 0, vol: 0 }));
        let today = new Date();
        
        workouts.forEach(w => {
            let wDate = new Date(w.date);
            let diffDays = Math.floor((today - wDate) / (1000 * 60 * 60 * 24));
            let weekIdx = 7 - Math.floor(diffDays / 7);
            
            if (weekIdx >= 0 && weekIdx < 8) {
                weeksData[weekIdx].freq += 1;
                weeksData[weekIdx].vol += (w.volume || 0);
            }
        });

        drawSVGChart(weeksData.map(d => d.freq), 'chartFreq');
        drawSVGChart(weeksData.map(d => d.vol), 'chartVolume');
    }

    function drawSVGChart(dataArr, containerId) {
        const svgW = 600;
        const svgH = 200;
        const padX = 20;
        const padY = 20;
        
        const maxVal = Math.max(...dataArr) || 1;
        const stepX = (svgW - padX * 2) / 7; // 8 points = 7 intervals

        let points = dataArr.map((val, i) => {
            let x = padX + (i * stepX);
            let y = svgH - padY - ((val / maxVal) * (svgH - padY * 2));
            return `${x},${y}`;
        });

        // Path d string
        let d = `M ${points[0]}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i]}`;
        }

        // Area d string (for shading)
        let areaD = `${d} L ${points[points.length-1].split(',')[0]},${svgH-padY} L ${padX},${svgH-padY} Z`;

        // Circles
        let circles = points.map(p => {
            let [x, y] = p.split(',');
            return `<circle cx="${x}" cy="${y}" r="4" class="chart-point" />`;
        }).join('');

        // Grid lines (horizontal)
        let grid = [0, 0.5, 1].map(mult => {
            let y = svgH - padY - (mult * (svgH - padY * 2));
            let label = Math.round(maxVal * mult);
            return `
                <line x1="${padX}" y1="${y}" x2="${svgW-padX}" y2="${y}" class="chart-grid-line" />
                <text x="0" y="${y+4}" class="chart-label">${label}</text>
            `;
        }).join('');

        let svgHtml = `
            <svg viewBox="0 0 ${svgW} ${svgH}" class="svg-chart" preserveAspectRatio="none">
                ${grid}
                <path d="${areaD}" class="chart-area" />
                <path d="${d}" class="chart-line" />
                ${circles}
            </svg>
        `;

        document.getElementById(containerId).innerHTML = svgHtml;
    }

    // --- Add Workout Wizard ---
    let currentStep = 1;
    const typeCards = document.querySelectorAll('.type-card');
    const exerciseSearch = document.getElementById('exerciseSearch');
    const exerciseResults = document.getElementById('exerciseResults');
    const activeExercisesList = document.getElementById('activeExercisesList');
    const sumType = document.getElementById('sumType');
    const sumExCount = document.getElementById('sumExCount');
    const sumVolume = document.getElementById('sumVolume');
    const summaryDate = document.getElementById('summaryDate');
    const summaryDuration = document.getElementById('summaryDuration');

    window.app = { ...window.app, startTemplate: (name) => {
        initWizard();
        currentWorkout.type = 'Strength'; 
        
        // Mock template loading
        let exNames = [];
        if(name === 'Push Day') exNames = ['Bench Press', 'Overhead Press', 'Tricep Extension'];
        if(name === 'Pull Day') exNames = ['Deadlift', 'Pull-up', 'Barbell Row', 'Bicep Curl'];
        if(name === 'Leg Day') exNames = ['Squat', 'Deadlift'];
        if(name === 'Full Body') exNames = ['Squat', 'Bench Press', 'Barbell Row'];

        exNames.forEach(n => {
            currentWorkout.exercises.push({
                id: Date.now() + Math.random(),
                name: n,
                sets: [{reps: '', weight: ''}]
            });
        });

        goToStep(2);
    }};

    function initWizard() {
        switchView('view-add-workout');
        currentWorkout = { type: '', date: '', duration: 45, exercises: [], volume: 0 };
        typeCards.forEach(c => c.classList.remove('selected'));
        activeExercisesList.innerHTML = '';
        exerciseSearch.value = '';
        exerciseResults.innerHTML = '';
        goToStep(1);
    }

    function goToStep(step) {
        currentStep = step;
        document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
        document.getElementById(`wizard-step-${step}`).classList.add('active');
        document.getElementById('stepIndicator').textContent = `Step ${step} of 3`;

        if (step === 2) {
            renderExerciseSearch('');
            renderActiveExercises();
        }
        if (step === 3) {
            prepareSummary();
        }
    }

    // Step 1
    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            typeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            currentWorkout.type = card.getAttribute('data-type');
            setTimeout(() => goToStep(2), 200);
        });
    });

    // Step 2
    exerciseSearch.addEventListener('input', (e) => renderExerciseSearch(e.target.value));

    function renderExerciseSearch(query) {
        const q = query.toLowerCase();
        // Only show exercises matching type (or all if query is typed to allow flexibility)
        const filtered = exerciseDB.filter(ex => 
            (ex.type === currentWorkout.type || currentWorkout.type === '') && 
            ex.name.toLowerCase().includes(q)
        );

        exerciseResults.innerHTML = filtered.map(ex => `
            <div class="ex-res-item" onclick="addExercise('${ex.name}')">
                <span>${ex.name}</span>
                <span style="color:var(--accent)">+</span>
            </div>
        `).join('');
    }

    window.addExercise = (name) => {
        currentWorkout.exercises.push({
            id: Date.now(),
            name: name,
            sets: [{ reps: '', weight: '', duration: '' }] // Generic set template
        });
        renderActiveExercises();
    };

    window.removeExercise = (id) => {
        currentWorkout.exercises = currentWorkout.exercises.filter(ex => ex.id !== id);
        renderActiveExercises();
    };

    window.addSet = (exId) => {
        const ex = currentWorkout.exercises.find(e => e.id === exId);
        if (ex) {
            ex.sets.push({ reps: '', weight: '', duration: '' });
            renderActiveExercises();
        }
    };

    // Update state on input blur to avoid re-rendering on every keystroke
    window.updateSet = (exId, setIndex, field, value) => {
        const ex = currentWorkout.exercises.find(e => e.id === exId);
        if (ex && ex.sets[setIndex]) {
            ex.sets[setIndex][field] = value;
        }
    };

    function renderActiveExercises() {
        const isStrength = currentWorkout.type === 'Strength' || currentWorkout.type === 'HIIT';

        activeExercisesList.innerHTML = currentWorkout.exercises.map(ex => {
            const setsHtml = ex.sets.map((set, i) => {
                if (isStrength) {
                    return `
                        <div class="set-row">
                            <span>${i+1}</span>
                            <input type="number" placeholder="Lbs" value="${set.weight}" onchange="updateSet(${ex.id}, ${i}, 'weight', this.value)">
                            <input type="number" placeholder="Reps" value="${set.reps}" onchange="updateSet(${ex.id}, ${i}, 'reps', this.value)">
                            <span></span>
                        </div>
                    `;
                } else {
                    return `
                        <div class="set-row" style="grid-template-columns: 40px 1fr 30px;">
                            <span>${i+1}</span>
                            <input type="number" placeholder="Duration (min)" value="${set.duration}" onchange="updateSet(${ex.id}, ${i}, 'duration', this.value)">
                            <span></span>
                        </div>
                    `;
                }
            }).join('');

            return `
                <div class="active-ex-card">
                    <div class="active-ex-header">
                        <h4>${ex.name}</h4>
                        <button class="btn-remove" onclick="removeExercise(${ex.id})">Remove</button>
                    </div>
                    <div class="sets-container">
                        ${setsHtml}
                    </div>
                    <button class="btn-add-set" onclick="addSet(${ex.id})">+ Add Set</button>
                </div>
            `;
        }).join('');
    }

    document.getElementById('btnPrev2').addEventListener('click', () => goToStep(1));
    document.getElementById('btnNext2').addEventListener('click', () => {
        if(currentWorkout.exercises.length > 0) goToStep(3);
        else alert("Please add at least one exercise.");
    });

    // Step 3
    function prepareSummary() {
        summaryDate.value = new Date().toISOString().split('T')[0];
        sumType.textContent = currentWorkout.type;
        sumExCount.textContent = currentWorkout.exercises.length;

        // Calculate Volume
        let vol = 0;
        currentWorkout.exercises.forEach(ex => {
            ex.sets.forEach(s => {
                if (s.weight && s.reps) {
                    vol += (parseFloat(s.weight) * parseInt(s.reps));
                }
            });
        });
        currentWorkout.volume = vol;
        sumVolume.textContent = vol;
    }

    document.getElementById('btnPrev3').addEventListener('click', () => goToStep(2));
    
    document.getElementById('btnSaveWorkout').addEventListener('click', () => {
        currentWorkout.date = summaryDate.value;
        currentWorkout.duration = summaryDuration.value;
        currentWorkout.id = Date.now();
        
        workouts.unshift(currentWorkout);
        saveWorkouts();
        
        switchView('view-dashboard');
    });

    // Initial render
    renderDashboard();
});