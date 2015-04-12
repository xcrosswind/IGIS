<?php
// Test DB
$db_hostname = 'localhost';
$db_port = '5432';
$db_name = 'Web';
$db_schema = 'bto_shogun';
$db_x_selex = 'x_selex';
$db_x_selexdata = 'x_selexdata';
$db_user = 'postgres';
$db_pw = 'postgres';
$db_driver = 'pdo_pgsql';

// Indigo DB Development
// $db_hostname = 'tbd';
// $db_port = 'tbd';
// $db_name = 'tbd';
// $db_schema = 'tbd';
// $db_user = 'tbd';
// $db_pw = 'tbd';
// $db_driver = 'pdo_oci';

// logging
define ( 'DEBUG', true );
$log_path = '../../../igis/logs/';
$igis_error_log = $log_path . 'igis_error_log.php';
$igis_access_log = $log_path . 'igis_access_log.php';

?>