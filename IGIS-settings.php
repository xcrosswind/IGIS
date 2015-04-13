<?php
// Test DB (localhost Christoph's Rechner)

$db_hostname = 'localhost';
$db_port = '5432';
$db_name = 'Web';
$db_schema = 'bto_shogun';
$db_user = 'tbd';
$db_pw_plain = 'tbd';
$db_pw = 'tbd';
$db_driver = 'pdo_pgsql';

// Indigo DB Development

// $db_hostname = 'tbd';
// $db_ip = 'tbd';
// $db_port = 'tbd';
// $db_name = 'tbd';
// $db_schema = 'tbd'; // TODO: check if necessary for Oracle!
// $db_user = 'tbd';
// $db_pw_plain = 'tbd';
// $db_pw = 'tbd';
// $db_driver = 'pdo_oci';

$db_secret = 'tbd';
$db_x_selex = 'x_selex';
$db_x_selexdata = 'x_selexdata';

// logging
define ( 'DEBUG', true );
$log_path = '../../../igis/logs/';
$igis_error_log = $log_path . 'igis_error_log.php';
$igis_access_log = $log_path . 'igis_access_log.php';

?>