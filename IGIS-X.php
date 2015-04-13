<?php
require_once "vendor/autoload.php";

set_include_path ( '../../../igis' );
require ('IGIS-settings.php');

$config = new \Doctrine\DBAL\Configuration ();
$connectionParams = array (
		'dbname' => $db_name,
		'user' => $db_user,
		'password' => $db_pw,
		'host' => $db_hostname,
		'port' => $db_port,
		'driver' => $db_driver 
);
// connect to database
$db = \Doctrine\DBAL\DriverManager::getConnection ( $connectionParams, $config );

$userSelection = json_decode ( stripslashes ( $_POST ['userSelection'] ) );

$user_id = $userSelection->user_id;
$src_id = $userSelection->src_id;
$timestamp = $userSelection->timestamp;
$active_guid = $userSelection->active_guid;
$actionType = $userSelection->actionType;
$objects = $userSelection->objects;

if ($actionType == 1) {
	// add entry in x_selex table
	insertIntoSelex ();
	// get selex_id (sequence value)
	$selex_id = getSelexId ();
	// add entries in x_selexdata table
	addSelexData ( $selex_id, $objects );
} elseif ($actionType == 2) {
	// get selex_id (sequence value)
	$selex_id = getSelexId ();
	// remove complete previous selection
	delSelexData ( $selex_id );
	// add entries in x_selexdata table
	addSelexData ( $selex_id, $objects );
} else {
	echo "abc";
}
function insertIntoSelex() {
	$queryBuilder = $GLOBALS ["db"]->createQueryBuilder ();
	
	$queryBuilder->insert ( $GLOBALS ["db_schema"] . "." . $GLOBALS ["db_x_selex"] );
	$queryBuilder->values ( array (
			'user_id' => '?',
			'src_id' => '?',
			'time_stamp' => '?',
			'active_guid' => '?' 
	) );
	$queryBuilder->setParameter ( 0, $GLOBALS ["user_id"] );
	$queryBuilder->setParameter ( 1, $GLOBALS ["src_id"] );
	// timestamp format 2015-03-16 09:52:09
	$date = new DateTime ( $GLOBALS ["timestamp"] );
	$queryBuilder->setParameter ( 2, $date->format ( "Y-m-d H:i:s" ) );
	$queryBuilder->setParameter ( 3, $GLOBALS ["active_guid"] );
	
	$sql = $queryBuilder->getSQL ();
	DEBUG ? error_log ( $sql . "\n", 3, $GLOBALS ["igis_access_log"] ) : null;
	
	try {
		$result = $queryBuilder->execute ();
	} catch ( Exception $e ) {
		error_log ( $e->getMessage () . "\n", 3, $GLOBALS ["igis_error_log"] );
	}
}
function getSelexId() {
	$queryBuilder = $GLOBALS ["db"]->createQueryBuilder ();
	
	$queryBuilder->select ( 'selex_id' );
	$queryBuilder->from ( $GLOBALS ["db_schema"] . "." . $GLOBALS ["db_x_selex"] );
	$queryBuilder->where ( 'user_id = ?' );
	$queryBuilder->andwhere ( 'src_id = ?' );
	$queryBuilder->andwhere ( 'time_stamp = ?' );
	$queryBuilder->andwhere ( 'active_guid = ?' );
	$queryBuilder->setParameter ( 0, $GLOBALS ["user_id"] );
	$queryBuilder->setParameter ( 1, $GLOBALS ["src_id"] );
	$queryBuilder->setParameter ( 2, $GLOBALS ["timestamp"] );
	$queryBuilder->setParameter ( 3, $GLOBALS ["active_guid"] );
	
	$sql = $queryBuilder->getSQL ();
	DEBUG ? error_log ( $sql . "\n", 3, $GLOBALS ["igis_access_log"] ) : null;
	
	$selex_id = - 1;
	try {
		$results = $queryBuilder->execute ();
		$selex_id = $results->fetchColumn ();
		DEBUG ? error_log ( $selex_id . "\n", 3, $GLOBALS ["igis_access_log"] ) : null;
	} catch ( Exception $e ) {
		error_log ( $e->getMessage () . "\n", 3, $GLOBALS ["igis_error_log"] );
	}
	
	return $selex_id;
}
function addSelexData($selex_id, $objects) {
	$queryBuilder = $GLOBALS ["db"]->createQueryBuilder ();
	
	foreach ( $objects as $o ) {
		$queryBuilder->insert ( $GLOBALS ["db_schema"] . "." . $GLOBALS ["db_x_selexdata"] );
		$queryBuilder->values ( array (
				'selex_id' => '?',
				'obj_id' => '?' 
		) );
		$queryBuilder->setParameter ( 0, $selex_id );
		$queryBuilder->setParameter ( 1, $o );
		
		try {
			$result = $queryBuilder->execute ();
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $GLOBALS ["igis_error_log"] );
		}
	}
}
function delSelexData($selex_id) {
	$queryBuilder = $GLOBALS ["db"]->createQueryBuilder ();
	
	$queryBuilder->delete ( $GLOBALS ["db_schema"] . "." . $GLOBALS ["db_x_selexdata"] );
	$queryBuilder->where ( 'selex_id = ?' );
	$queryBuilder->setParameter ( 0, $selex_id );
	
	try {
		$result = $queryBuilder->execute ();
	} catch ( Exception $e ) {
		error_log ( $e->getMessage () . "\n", 3, $GLOBALS ["igis_error_log"] );
	}
}

$vars = array_keys ( get_defined_vars () );
for($i = 0; $i < sizeOf ( $vars ); $i ++) {
	unset ( $$vars [$i] );
}
unset ( $vars, $i );
?>