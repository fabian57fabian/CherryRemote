// JavaScript Document

(function ($) {
    $.fn.remote = function (options) {
        var defaults = {
            serverURL: "example.com/server_page_url",
        };
        var readTrasparetColor = 'rgba(122,244,66,0.5)';

        var remote_add_commands = [];
        var data_add_remote = {};
        var list_div;
        var model_div;

        var nodemcuChannel = ":80/channel_IR";

        var current_channel = "";
        var current_remote = "";

        options = $.extend(defaults, options);
        console.log("PHP page: " + defaults['serverURL']);

        gestisciAggiungi();
        gestisciCancella();
        getTelecomandi();


        /*INIZIO CODICE AGGIUNTA TELECOMANDO*/
        var color_add_Remote = '#008F95';
        var last_color_background = '';

        function gestisciAggiungi() {
            $(".addRemoteButton").on("click", function (event) {
                aggiungiTelecomando();
            });
        }

        function aggiungiTelecomando() {
            remote_add_commands = [];
            list_div = $(".list").detach();
            model_div = $(".remote_plugin div").detach();
            last_color_background = $("body").css('background-color');
            $("body").css('background-color', color_add_Remote);
            console.log("INIZIO aggiunta telecomando");
            $(".remote_plugin").load("addRemote.html", function () {
                handleAddModelsToListBox();
                handleAddControllersToListBox();
                $(".remote_add_confirm").on("click", btnConfirm_click);
                $(".remote_add_cancel").on("click", btnCancel_click);
            });
        }

        function btnCancel_click(event) {
            restoreUIFromAddRemote();
        }

        function name_to_key(name) {
            return name.replace(/\s+/g, '_').toLowerCase();
        }

        function btnConfirm_click(event) {
            console.log("inizio scelta comandi per il modello selezionato");
            data_add_remote.description = $("#remote_name").val();
            data_add_remote.model = $("#select_model option:selected").val();
            data_add_remote.controller = $("#select_controller option:selected").text();
            insertRemoteIntoDB(data_add_remote);
        }

        function insertCommandsIntoDB(remote_id) {
            console.log("Invocando il comando per inserire i comandi del remote ");
            $.each(remote_add_commands, function (index, value) {
                var request = $.ajax({
                    url: options.serverURL,
                    type: "POST",
                    data: {
                        "action": "insert_commands",
                        "remote_id": remote_id,
                        "class": value['class'],
                        "code": value['code'],
                        "receiver": value['receiver']
                    },
                    dataType: "json"
                });
                request.done(function (result) {
                    if (result['result'] == "OK") {
                        console.log("succesfully inserted commands to DB ");
                    }
                });
                request.fail(function (jqXHR, textStatus) {
                    alert("Unable to insert commands into DB: " + jqXHR.responseText);
                    console.log(jqXHR);
                });
            });
        }

        function insertRemoteIntoDB(data_add_remote) {
            console.log("Invocando il comando per inserire il remote " + data_add_remote['name']);
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {
                    "action": "insert_remote",
                    "value": data_add_remote['description'],
                    "model": data_add_remote['model'],
                    "controller": data_add_remote['controller']
                },
                dataType: "json"
            });
            request.done(function (result) {
                if (result['result'] == "OK") {
                    console.log("succesfully inserted remote to DB ");
                    insertCommandsIntoDB(result['remote_id']);
                    restoreUIFromAddRemote();
                }
            });
            request.fail(function (jqXHR, textStatus) {
                alert("Unable to insert remote from DB: " + jqXHR.responseText);
                console.log(jqXHR);
            });
        }

        function restoreUIFromAddRemote() {
            var $body = $("body");
            var $plugin = $(".remote_plugin");
            $plugin.empty();
            $body.prepend(list_div);
            //$plugin.append(model_div);
            model_div = "";
            remote_add_commands = [];
            data_add_remote = {};
            $body.css('background-color', last_color_background);
            $(".listbox").empty();
            getTelecomandi();
            //per fare alla svelta non aggiungo il telecomando qui, ma andrebbe fatto (TODO)
            //selectFirstRemoteFromDropDown();
        }

        /*INIZIO handle list box channels*/

        function handleAddControllersToListBox() {
            console.log("asking for models");
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {"action": "get_controllers"},
                dataType: "json"
            });

            request.done(function (result) {
                    console.log("LOAD CONTROLLERS DONE");
                    if (result['result'] == "OK") {
                        var $controllers = result['data'];
                        var $select = $("#select_controller");
                        $.each($controllers, function (index_model, controller) {
                            $select.append($('<option>', {
                                value: controller['ip'],
                                text: controller['name']
                            }));
                        });
                        selectFirstControllerFromDropDown();
                        $(document).on('change', '#select_controller', handleControllerChanged);
                    }
                    else {
                        console.log("Unable to load controllers from php: " + result);
                    }
                }
            );

            request.fail(
                function (jqXHR, textStatus) {
                    alert("Unable to load controllers from DB: " + jqXHR.responseText);
                    console.log(jqXHR);
                }
            );
        }

        function selectFirstControllerFromDropDown() {
            var $first = $('#select_controller option:first');
            $('#select_controller select').val($first.val());
            handleControllerChanged();
        }

        function handleControllerChanged() {
            current_channel = $('#select_controller option:selected').val();
        }

        /*FINE handle list box channels*/

        /*INIZIO handle list box models*/
        function handleAddModelsToListBox() {
            console.log("asking for models");
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {"action": "get_models"},
                dataType: "json"
            });

            request.done(function (result) {
                    console.log("LOAD MODELS DONE");
                    if (result['result'] == "OK") {
                        var $groups = result['data'];
                        var $select = $("#select_model");
                        $.each($groups, function (index, value) {
                            $select.append("<optgroup id=\"" + value['group'] + "\" label=\"" + value['group'] + "\">");
                            var $models = value['models'];
                            $.each($models, function (index_model, value_model) {
                                $('#' + value['group']).append($('<option>', {
                                    value: value_model,
                                    text: value_model
                                }));
                            });
                        });
                        selectFirstModelFromDropDown();
                        $(document).on('change', '#select_model', lstboxModels_change);
                    }
                    else {
                        console.log("Unable to load models from php: " + result);
                    }
                }
            );

            request.fail(
                function (jqXHR, textStatus) {
                    alert("Unable to load models from DB: " + jqXHR.responseText);
                    console.log(jqXHR);
                }
            );
        }

        function lstboxModels_change(event) {
            var modello = $('#select_model option:selected').val();
            handleModelChanged(modello);
        }

        function selectFirstModelFromDropDown() {
            var $first = $('#select_model option:first');
            $('#select_model select').val($first.val());
            handleModelChanged($first.val());
        }

        function handleModelChanged(model) {
            var $plugin = $(".remote_plugin_add");
            $plugin.empty();
            $plugin.load("models\\" + model + ".html", addButtonsModel_add);
        }

        function addButtonsModel_add() {
            var buttons = document.querySelectorAll('.remote_plugin_add button');
            buttons.forEach(function ($btn) {
                $($btn).on("click", function (e) {
                    manageRead(this.id);
                });
            });
        }

        /*FINE handle list box models*/

        function manageRead(button_id) {
            console.log("Button predssed for register: " + button_id);
            console.log("sending read signal");
            var request = $.ajax({
                url: "http://" + current_channel + nodemcuChannel,
                type: "POST",
                data: {"plain": "{\"type\": \"read\"}"},
                dataType: "json",
                timeout: 5000
            });

            request.done(function (data, textStatus, xhr) {
                if (data['result'] == "OK") {
                    console.log("Read done! Code: " + data['code'] + ", Receiver: " + data['receiver']);
                    var found = false;
                    $.each(remote_add_commands, function (index, value) {
                        if (value.class == button_id) {
                            value.code = data['code'];
                            value.receiver = data['receiver'];
                            found = true;
                        }
                    });
                    if (!found) {
                        remote_add_commands.push({class: button_id, code: data['code'], receiver: data['receiver']});
                    }
                    $("#" + button_id).css('background', readTrasparetColor);
                } else {
                    console.log("Read code received but answer not ok");
                }
            });

            request.fail(function (jqXHR, textStatus) {
                alert("Unable to read command: " + jqXHR.responseText);//jqXHR.responseText);
                console.log(jqXHR);
            });

        }

        /*FINE ADD REMOTE*/

        function gestisciCancella() {
            $("#cancelRemoteButton").on("click", function (event) {
                if ($("#remotes_list").children().length > 0) {
                    var $scelta = $(".dropDownRemotes option:selected");
                    if ($scelta.text() != null) {
                        if (confirm("delete " + $scelta.text() + "?")) {
                            deleteRemoteFromDB($scelta.val());
                        }
                    }
                }
                return false;
            });
        }

        function deleteRemoteFromDB(telecomando) {
            if (telecomando == null) {
                return;
            }
            console.log("Invocando il comando per cancellare " + telecomando);
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {"action": "delete_remote", "remote": telecomando},
                dataType: "json"
            });
            //il nome del telecomando è nella variabile 'remote'
            request.done(function (result) {
                if (result['result'] == "OK") {
                    console.log("succesfully deleted remote from DB " + telecomando);
                    handleDelete(telecomando);
                } else {
                    alert("Unable to delete remote from DB");
                }
            });
            request.fail(function (jqXHR, textStatus) {
                alert("Unable to delete remote from DB: " + jqXHR.responseText);
                console.log(jqXHR);
            });
        }

        function handleDelete(telecomando) {
            $.each($("#remotes_list").children(), function (index, $child) {
                var c = "2";
                if ($($child).attr('value') == telecomando) {
                    $child.remove();
                }
            });
            if ($("#remotes_list").children().length == 0) {
                var $plugin = $(".remote_plugin");
                $plugin.empty();
                $plugin.load("models\\mod_empty.html");
            } else {
                selectFirstRemoteFromDropDown();
            }
        }

        function caricaDropDownMenu(telecomandi) {
            var $form = $(".dropDownRemotes select");
            $.each(telecomandi, function (index, value) {
                $form.append("<option value=\"" + value['value'] + "\" data-model=\"" + value['model'] + "\"  data-controller=\"" + value['controller'] + "\" >" + value['nome'] + "</option>");
            });
        }

        function getTelecomandi() {
            console.log("asking for remotes");
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {"action": "get_remotes"},
                dataType: "json"
            });

            request.done(function (result) {
                    if (result['result'] == "OK") {
                        var telecomandi = [];
                        $.each(result['data'], function (index, value) {
                            telecomandi.push({
                                nome: value['value'],
                                value: value['name'],
                                model: value['model'],
                                controller: value['controller']
                            });
                        });
                        caricaDropDownMenu(telecomandi);
                        $(document).on('change', '.dropDownRemotes', function (e) {
                            var selezione = $(".dropDownRemotes option:selected");
                            var model = selezione.attr('data-model');
                            var value = selezione.attr('value');
                            handleRemoteChanged(model, value);
                        });
                        console.log("LOAD REMOTES DONE");
                        selectFirstRemoteFromDropDown();
                    }
                    else {
                        console.log("Unable to load remotes from php: " + result);
                    }
                }
            );

            request.fail(
                function (jqXHR, textStatus) {
                    alert("Unable to load remotes from DB: " + jqXHR.responseText);
                    console.log(jqXHR);
                }
            );
        }

        function selectFirstRemoteFromDropDown() {
            var $first = $('.dropDownRemotes select option:first');
            $('.dropDownRemotes select').val($first.val());
            handleRemoteChanged($first.attr('data-model'), $first.attr('value'));
        }

        function handleRemoteChanged(model, telecomando) {
            var $plugin = $(".remote_plugin");
            $plugin.empty();
            if ($("#remotes_list").children().length == 0) {
                $plugin.load("models\\mod_empty.html");
            } else {
                $plugin.load("models\\" + model + ".html", addButtonsEvents);//modelli[selected]);
                current_remote = telecomando;
                handleBottoni(telecomando);
            }
        }

        function handleBottoni(telecomando) {
            console.log("asking for remotes");
            var request = $.ajax({
                url: options.serverURL,
                type: "POST",
                data: {"remote": telecomando, "action": "get_commands"},
                dataType: "json"
            });

            request.done(function (results) {
                var $button;
                $.each(results['data'], function (index, value) {
                    $button = $("#" + value['class']);
                    $button.attr('data-code', value['code']);
                    $button.attr('data-receiver', value['receiver']);
                    console.log(value['remote']);
                });
            });

            request.fail(
                function (jqXHR, textStatus) {
                    alert("Unable to load commands from DB: " + jqXHR.responseText);
                    console.log(jqXHR);
                }
            );
        }

        function addButtonsEvents() {
            //var buttons = document.querySelectorAll('button');

            $.each($(".remote_plugin button"), function (index, $btn) {
                //setti che quando avviene l'evento click, chiamiamo il metodo sendToDo
                $($btn).on("click", function (event) {
                    console.log("Remote changed or pressed");
                    if ($(this).data("code") != "nnn") {
                        var controller_ip = $("#remotes_list option:selected").data("controller");
                        sendIRToNodeMCU($btn, $(this).data("code"), $(this).data("receiver"), controller_ip);
                    }
                });
            });
        }

        /*
        function getAccess() {
            console.log("sending access signal");
            var request = $.ajax({
                url: options['serverNodeMCU'],
                type: "POST",
                data: {"plain": "{\"type\": \"access\"}"},
                dataType: "json",
                timeout: 5000
            });
            request.fail(function (jqXHR, textStatus) {
                    alert("Failed to connect to device: " + jqXHR.responseText);
                    console.log(jqXHR);
                }
            );
            request.done(function (data) {
                console.log("Access done!" + data);
            });
        }

        */

        function sendIRToNodeMCU($button, code_IR, receiver, controller) {
            request_type = "send";
            if (code_IR.constructor === Array) {
                code_IR = "[" + code_IR.toString() + "]";
            } else {
                code_IR = "\"" + code_IR + "\"";
            }
            console.log("We have to send code " + code_IR);

            if (code_IR.length > 2) {
                //è così che si fa una richiesta AJAX XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                var request = $.ajax({
                    url: "http://" + controller + nodemcuChannel,
                    type: "POST",
                    data: {"plain": "{\"type\": \"send\", \"code\": " + code_IR + ", \"receiver\":\"" + receiver + "\"}"},
                    dataType: "json",
                    timeout: 3000
                });
                //setti cosa fare quando la richiesta è andata a buon fine
                request.done(function (data, textStatus, xhr) {
                    console.log("REQUEST.DONE. STATUS: " + xhr.status + " DATA: " + data);
                });
            }
        }
    }

})
(jQuery);
