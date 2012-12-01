(function (window) {

    /* функции работы с временем */
    var secondsToTime = function (seconds) {
        var _minutes = parseInt((seconds / 60), 10);
        var _hours = parseInt( (_minutes / 60), 10 );
        var _minutesResidue = _minutes % 60;

        var _secondsResidue = seconds % 60;

        if(_hours.toString().length == 1) _hours = "0" + _hours;
        if(_minutesResidue.toString().length == 1) _minutesResidue = "0" + _minutesResidue;

        return _hours + ":" + _minutesResidue; //+ ":" + _secondsResidue
    };

    var timeToSeconds = function (time) {
        var _digits = time.split(":");
        return (parseInt(_digits[0], 10) * 3600) + 60 * parseInt(_digits[1], 10);
    };

    var dateToString = function (date) {
        var _day = date.getDate().toString();
            _day = _day.length == 1 ? "0" + _day : _day;
        var _month = (date.getMonth() + 1).toString();
            _month = _month.length == 1 ? "0" + _month : _month;
        var _year = date.getFullYear();
        return _year + "-" + _month + "-" + _day;
    };

    var getTimeFromDate = function (date) {
        return date.toTimeString().split(' ')[0];
    };

    /*/функции работы с временем */


    var presets = [];
    var _todaystat = [];

    var statistics = $LO({ "stat": _todaystat, "commonTodayTime": $LO.eventable(0, {"onSet": function (newValue) {
        document.querySelector("#common-time-ticker").innerHTML = secondsToTime(newValue);
    }
    })}, { "onPush": function (value) {

        var $self = this;

        if(!this.stopAllTimers) this.stopAllTimers = function () {
            for(var i = 0; i < this.length; i++) {
                this[i].stopTimer();
            }
        };
        Object.defineProperty(this, "stopAllTimers", { enumerable: false });


        var table = document.querySelector("#today-table");

        var _issueLabelCell = document.createElement("td");
            _issueLabelCell.innerHTML = value.title;
        var _timeCell = document.createElement("td");
            _timeCell.innerHTML = secondsToTime(value.time);
            _timeCell.classList.add("timer-is-work");
        var _actionsCell = document.createElement("td");

        var _actionButton = document.createElement("button");
            _actionButton.classList.add("btn");
            _actionButton.classList.add("btn-mini");

            _actionButton.addEventListener("click", function (event) {
                var _action = event.target.getAttribute("action");
                if(_action == "stop") {
                    value.stopTimer();
                }
                if(_action == "start") {
                    value.startTimer();
                }
            });

            _actionsCell.appendChild(_actionButton);

        var _row = document.createElement("tr");
            _row.appendChild(_issueLabelCell);
            _row.appendChild(_timeCell);
            _row.appendChild(_actionsCell);

        table.querySelector("tbody").appendChild(_row);

        value.time = $LO.eventable(value.time, {
            "onSet": function (newValue) {
                _timeCell.innerHTML = secondsToTime(newValue);
            }
        });

        value.stopTimer = function () {
            _actionButton.classList.remove("btn-danger");
            _actionButton.classList.add("btn-primary");
            _actionButton.innerHTML = "Старт";
            _actionButton.setAttribute("action", "start");
            _timeCell.classList.remove("timer-is-work");
            clearInterval(value.interval);
            value.stop = new Date().getTime();
            window.setTodayStatistics();
        };

        value.startTimer = function () {
            $self.stopAllTimers(); //выпилить, если допустима работа более одного таймера в момент времени
            _actionButton.classList.remove("btn-primary");
            _actionButton.classList.add("btn-danger");
            _actionButton.innerHTML = "Стоп";
            _actionButton.setAttribute("action", "stop");
            _timeCell.classList.add("timer-is-work");

            value.lastTime = new Date(); //сохраняем последнее полученное значение даты

            value.interval = setInterval(function () {

                var _diff = new Date() - value.lastTime;
                value.lastTime = new Date();
                if(_diff < 2000) { //м.б. 1010 или интервал 995-1010 ?
                    value.time++;
                    statistics.commonTodayTime++;
                } else {
                    /* корректировка ухода в спящий режим */
                    console.log('Время откорректировано');
                    value.time += Math.round( _diff / 1000 );
                    statistics.commonTodayTime += Math.round( _diff / 1000 );
                }

            }, 1000);
        };
        value.startTimer();

    } });

    window.statistics = statistics;

    window.addEventListener('load', function () {

        /* прописываем текущую дату */
        document.querySelector("#current-date-field").innerHTML = new Date().toLocaleDateString();
        /*/*/

        /* загружаем сохраненную статистику на сегодня */
        var _tstat = window.getTodayStatistics();
        for(var k = 0; k < _tstat.length; k++) {
            statistics.commonTodayTime += _tstat[k].time;
            statistics.stat.push(_tstat[k]);
        }
        if(statistics.stat.stopAllTimers) statistics.stat.stopAllTimers();
        /* /загружаем сохраненную статистику на сегодня */

        /* добавление задачи через ввод названия */
        document.querySelector("#add-new-issue-button").addEventListener('click', function () {
            var input = document.querySelector("#new-issue-name");
            var issue = {
                "title": input.value,
                "time": 0,
                "start": new Date().getTime(),
                "stop": 0
            };
            input.value = "";
            statistics.stat.push(issue);
        });
        /*/*/

        /* популярные задачи */
        var _frequentlyTaskClickHandler = function (event) {
            var _title = event.target.innerHTML;
            var issue = {
                "title": _title,
                "time": 0,
                "start": new Date().getTime(),
                "stop": 0
            };
            statistics.stat.push(issue);
        };

        var _items = document.querySelectorAll("li.frequently-task a");
        for(var i = 0; i < _items.length; i++) {
            _items[i].addEventListener("click", _frequentlyTaskClickHandler);
        }
        /* /популярные задачи */


        /* добавить новую популярную задачу */
        var appendFrequentlyTask = function (title) {
            var _a = document.createElement("a");
                _a.setAttribute("href", "#");
                _a.innerHTML = title;
            var _li = document.createElement("li");
                _li.classList.add("frequently-task");
            _li.appendChild(_a);
            _a.addEventListener("click", _frequentlyTaskClickHandler);
            document.querySelector("#freq-tasks").appendChild(_li);
        };

        presets = window.getFrequentlyTasks();
        for(var i = 0; i < presets.length; i++) {
            appendFrequentlyTask(presets[i]);
        }

        document.querySelector("#add-new-frequently-task-button").addEventListener("click", function (event) {
            var _et = event.target;
            _et.style.display = "none";
            _et.parentNode.querySelector("form").style.display = "";
        });

        document.querySelector("#add-ft-button").addEventListener("click", function (event) {
            var _et = event.target;
            _et.parentNode.style.display = "none";
            var _parentDiv = _et.parentNode.parentNode;
            _parentDiv.querySelector("#add-new-frequently-task-button").style.display = "";

            var _ftName = _et.parentNode.querySelector("#new-frequently-task-name").value;
            if(_ftName != "") {
                presets.push(_ftName);
                appendFrequentlyTask(_ftName);
                window.setFrequentlyTasks();
            }
        });
        /* /добавить новую популярную задачу */

        /* переключение по страницам */
        document.querySelector("#main-page-link").addEventListener("click", function (event) {
            document.querySelector("#statistics-page-link").classList.remove("active");
            event.target.parentNode.classList.add("active");
            document.querySelector("#statistics-page").style.display = "none";
            document.querySelector("#main-page").style.display = "";
        });
        document.querySelector("#statistics-page-link").addEventListener("click", function (event) {
            window.setTodayStatistics();
            document.querySelector("#main-page-link").classList.remove("active");
            event.target.parentNode.classList.add("active");
            document.querySelector("#main-page").style.display = "none";
            document.querySelector("#statistics-page").style.display = "";

            renderStat['today-stat-block']();
        });
        /* /переключение по страницам */

        /* переключалки статистики */
        var _statButtons = document.querySelectorAll("#stat-selector li");
        var _statTabs = document.querySelectorAll("#stat-tabs div.row-fluid");
        for(var k = 0; k < _statButtons.length; k++){
            _statButtons[k].addEventListener("click", function (event) {
                for(var l = 0; l < _statButtons.length; l++){
                    _statButtons[l].classList.remove("active");
                    _statTabs[l].style.display = "none";
                }
                var _parentLi = event.target.parentNode;
                document.querySelector("#" + _parentLi.getAttribute("ref-id")).style.display = "";
                _parentLi.classList.add("active");

                renderStat[_parentLi.getAttribute("ref-id")]();
            });
        }
        /* /переключалки статистики */
    });

    var renderStat = {
        'today-stat-block': function () {
            var _table = document.querySelector("#today-stat-block table");
            var _chartContainer = document.querySelector("#today-statistics-chart");
            this['clear-table'](_table);
            this['build-table'](window.getTodayStatistics(), _table);
            this['build-chart'](window.getTodayStatistics(), _chartContainer);
        },
        'month-stat-block': function () {
            var _table = document.querySelector("#month-stat-block table");
            var _chartContainer = document.querySelector("#month-statistics-chart");
            this['clear-table'](_table);
            var _mst = window.getMonthStatistics();
            var _mstPrep = [];
            for(var i in _mst) {
                for(var k = 0; k < _mst[i].length; k ++) {
                    _mstPrep.push(_mst[i][k]);
                }
            }
            this['build-table'](_mstPrep, _table);
            this['build-chart'](_mstPrep, _chartContainer);
        },
        'common-stat-block': function () {
            var _table = document.querySelector("#common-stat-block table");
            var _chartContainer = document.querySelector("#common-statistics-chart");
            this['clear-table'](_table);
            var _cst = window.getCommonStatistics();
            var _cstPrep = [];
            for(var i in _cst) {
                for(var k = 0; k < _cst[i].length; k ++) {
                    _cstPrep.push(_cst[i][k]);
                }
            }
            this['build-table'](_cstPrep, _table);
            this['build-chart'](_cstPrep, _chartContainer);
        },
        'clear-table': function (table) {
            var _tr = table.querySelectorAll("tbody tr");
            for(var i = 0; i < _tr.length; i++){
                table.querySelector("tbody").removeChild(_tr[i]);
            }
        },
        'build-table': function (stat, table) {
            var _preparedSt = {};
            var _timeSum = 0;
            var i = 0;
            for(var k = 0; k < stat.length; k++) {
                _timeSum += stat[k].time;
                if(_preparedSt[stat[k].title]) {
                    _preparedSt[stat[k].title].commonTime += stat[k].time;
                } else {
                    _preparedSt[stat[k].title] = {
                        "commonTime": stat[k].time
                    }
                }
            }
            for(var l in _preparedSt){
                _preparedSt[l].percent = _preparedSt[l].commonTime / _timeSum * 100;
                var _row = document.createElement("tr");
                    _row.innerHTML = "<td><div style='width: 30px; height: 20px; background-color: " + this['tasks-colors'][i] + ";'></div></td><td>" + l + "</td><td>" +secondsToTime(_preparedSt[l].commonTime) + "</td><td>" + Math.round(_preparedSt[l].percent) + "</td>";
                table.querySelector("tbody").appendChild(_row);
                i++;
            }
        },
        'build-chart': function (stat, container) {
            var _preparedSt = {};
            var _timeSum = 0;
            var _parts = [];
            for(var k = 0; k < stat.length; k++) {
                _timeSum += stat[k].time;
                if(_preparedSt[stat[k].title]) {
                    _preparedSt[stat[k].title].commonTime += stat[k].time;
                } else {
                    _preparedSt[stat[k].title] = {
                        "commonTime": stat[k].time
                    }
                }
            }
            for(var l in _preparedSt){
                _preparedSt[l].percent = _preparedSt[l].commonTime / _timeSum * 100;
                _parts.push({percent: _preparedSt[l].percent});
            }
            var charts = new Charts(container, {
                "options": {
                    "colors": this['tasks-colors'],
                    "radius": 80
                },
                "parts": _parts
            });
            charts.buildChart();
        },
        'tasks-colors': ['#1E9E56', '#48B8E8', '#DB3957', '#EDDE37', '#A52EB0']
    };


    /* функции работы со статистикой */
    window.setTodayStatistics = function () {
        /* если дата начала и окончания не совпадают с текущим днем, не сохранять */
        var _st = window.getCommonStatistics() ? window.getCommonStatistics() : {};
        var _preparedStat = [];
        for(var i = 0; i < statistics.stat.length; i++) {
            var _stopDate = dateToString(new Date(statistics.stat[i].stop));
            if (_stopDate == dateToString(new Date()) || statistics.stat[i].stop == 0) _preparedStat.push(statistics.stat[i]);
        }
        _st[dateToString(new Date())] = _preparedStat;
        localStorage.setItem("stat", JSON.stringify(_st));
    };

    window.getTodayStatistics = function () {
        if(window.getCommonStatistics()) {
            return window.getCommonStatistics()[dateToString(new Date())] ? window.getCommonStatistics()[dateToString(new Date())] : [];
        } else return false;
    };

    window.getMonthStatistics = function () {
        if(window.getCommonStatistics()) {
            var _commonStatistics = window.getCommonStatistics();
            var _currentMonth = dateToString(new Date()).split('-')[1];
            var _monthStatistics = {};
            for(var i in _commonStatistics) {
                if(i.split('-')[1] == _currentMonth) {
                    _monthStatistics[i] = _commonStatistics[i];
                }
            }
            return _monthStatistics;
        }
    };

    window.getCommonStatistics = function () {
        var _thereIsStat = localStorage.getItem("stat") ? true : false;
        if(_thereIsStat) {
            return JSON.parse(localStorage.getItem("stat"));
        } else {
            console.info("Statistics are empty");
            return false;
        }
    };
    /* /функции работы со статистикой */

    /* функции для работы с популярными задачами */
    window.getFrequentlyTasks = function () {
        return localStorage.getItem("freq-tasks") ? JSON.parse(localStorage.getItem("freq-tasks")) : [];
    };

    window.setFrequentlyTasks = function () {
        if(presets.length) {
            localStorage.setItem("freq-tasks", JSON.stringify(presets));
        }
    };
    /* функции для работы с популярными задачами */


    /* сохраняем стату каждые 5 минут */
    window.saveStatInterval = setInterval(function () {
        window.setTodayStatistics();
    }, 1000 * 60 * 5);
    /* / */

})(window);


// value.isWork - идендификатор, работает таймер или нет. Подписаться на изменение

//випилить переменные window

//если время больше 12 ночи, а на странице есть таймеры, сохранить их в предыдущий день

//проценты округлять до 2го знака после 0

//возникнут проблемы с номером января-месяца - он будет 13 - обратить внимание