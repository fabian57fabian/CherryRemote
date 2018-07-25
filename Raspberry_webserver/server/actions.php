<?php
	/* setta il formato di risposta */
	header('Content-Type: text/json');
	require_once("config.php");
	$action = $_POST['action'];
	
	/* smista secondo il tipo di richiesta */
	switch($action) {
		case "get_remotes" :
			loadRemotes();
		break;
		case "delete_remote" :
			deleteRemote();
		break;
		case "get_commands" :
            loadCommands();
		break;
		case "get_models":
		    get_models();
		break;
		case "insert_remote":
        	insertRemote();
        break;
        case "insert_commands":
            insertCommands();
        break;
        case "get_controllers":
            get_controllers();
        break;
	}
	
	function loadRemotes() {
		$query_string = 'SELECT id, value, model, `controllers`.ip as controller FROM `remotes` JOIN `controllers` ON remotes.controller = controllers.name;';
		$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
    	// esegui la query
		$result = $mysqli->query($query_string);
    	$remotes = array();
    	// cicla sul risultato
		while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
			$remote = array('name' => $row['id'],'value' =>$row['value'], 'model' => $row['model'], 'controller' => $row['controller']);
			array_push($remotes, $remote);
		}

    	$response = array('result' => 'OK', 'data' => $remotes);
        $mysqli->close();
		// encodo l'array in JSON
		echo json_encode($response);
    }

    function deleteRemote(){
        if(isset($_POST['remote'])){
            $remote=$_POST['remote'];
        }else{
             echo json_encode(array('result' => 'ERROR'));
             return;
        }
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
        $query_string = 'DELETE FROM remotes WHERE id= \'' . $remote . '\'';
        if($mysqli->query($query_string) === FALSE){
            echo json_encode(array('result' => 'ERROR'));
            return;
        }
        $mysqli->close();
        echo json_encode(array('result' => 'OK'));
    }

    function insertRemote(){
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
        $query_string = 'INSERT INTO remotes (`value`, `model`, `controller`) VALUES (\'' . $_POST['value']. '\',\'' . $_POST['model']. '\',\'' . $_POST['controller']. '\');';
        if($mysqli->query($query_string) === FALSE){
            echo("Error description: " . mysqli_error($mysqli));
            echo json_encode(array('result' => 'ERROR'));
            return;
        }
        $record_id = mysqli_insert_id($mysqli);
        $mysqli->close();// chiudo la connessione a MySQL
        echo json_encode(array('result' => 'OK', 'remote_id' => $record_id));
    }

    function insertCommands(){
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
        $query_string='INSERT INTO `commands` (`class`, `code`, `receiver`, `remote`) VALUES (\'' . $_POST['class'] . '\',\'' . $_POST['code']. '\',\''. $_POST['receiver']. '\',\''. $_POST['remote_id']. '\');';
        if($mysqli->query($query_string) === FALSE){
            echo("Error description: " . mysqli_error($mysqli));
            echo json_encode(array('result' => 'ERROR'));
            return;
        }
        $mysqli->close();// chiudo la connessione a MySQL
        echo json_encode(array('result' => 'OK'));
    }

	function loadCommands(){
        if(isset($_POST['remote'])){
            $remote=$_POST['remote'];
        }else{
             echo json_encode(array('result' => 'ERROR'));
             return;
        }
        $query_string='SELECT * FROM commands WHERE remote = \'' . $remote . '\'';
        $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
        $result = $mysqli->query($query_string);
        $commands = array();
        while ($row = $result->fetch_array()) {
                $command = array('class' => $row['class'],'code' =>$row['code'], 'receiver' => $row['receiver']);
                array_push($commands, $command);
        }
        $response = array('result' => 'OK', 'data' => $commands);
        $mysqli->close();
        // encodo l'array in JSON
        echo json_encode($response);
    }

    function get_controllers(){
        $query_string = 'select * from controllers;';
    	$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
    	$result = $mysqli->query($query_string);
    	$controllers = array();
    	while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
    	    array_push($controllers, array('name' => $row['name'],'ip' =>$row['ip']));
    	}
    	echo json_encode(array('result' => 'OK', 'data' => $controllers));
    }

    function get_models(){
        $query_string = 'select * from models order by genre;';
    	$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
    	$result = $mysqli->query($query_string);
    	$gruppi = array();
    	$curr_models = array();
    	$prec='b4i5ubf4iubftntyi4ub5';
		while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
		    if($row['genre'] != $prec){
		        array_push($gruppi, array('group' => $prec, 'models' => $curr_models));
		        $curr_models = array();
		        $prec = $row['genre'];
		    }
		    array_push($curr_models, $row['name']);
		}
		array_push($gruppi, array('group' => $prec, 'models' => $curr_models));
		array_shift($gruppi);
        echo json_encode(array('result' => 'OK', 'data' => $gruppi));
    }
?>