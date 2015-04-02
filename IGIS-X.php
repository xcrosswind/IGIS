  <html>
<body> 
<?php
// Connecting, selecting database
$db = pg_connect ( "host=localhost port=5432 dbname=Web user=postgres password=postgres" ) or die ( 'Could not connect: ' . pg_last_error () );
$userSelection = json_decode ( stripslashes ( $_POST ['userSelection'] ) );

$user_id = pg_escape_string ( $userSelection->user_id );
$active_guid = pg_escape_string ( $userSelection->active_guid );
$points = $userSelection->points;

foreach ( $points as $p ) {
	// echo $p;
	$query = "INSERT INTO js.insert (user_id, active_guid, name) VALUES('" . $user_id . "', '" . $active_guid . "', '" . $p . "')";
	$result = pg_query ( $query );
	if (! $result) {
		$errormessage = pg_last_error ();
	} else {
	}
}

pg_close ();
?>
</body>
</html>
