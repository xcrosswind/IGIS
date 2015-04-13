<?php
// Test DB
$db_hostname = 'localhost';
$db_port = '5432';
$db_name = 'Web';
$db_schema = 'bto_shogun';
$db_x_selex = 'x_selex';
$db_x_selexdata = 'x_selexdata';
$db_user = 'postgres';
$db_pw_plain = 'postgres';
$db_pw = 'lG^tG?s+';

$db_driver = 'pdo_pgsql';

$db_secret = 'This is my secret key; with symbols (@$^*&<?>/!#_+), cool eh?!!! :)';

// Indigo DB Development

// $db_hostname = 'sTgpdb01';
// $db_ip = '10.239.181.131';
// $db_port = '2149';
// $db_name = 'D148SHG';
// $db_schema = 'tbd'; // TODO: check if necessary for Oracle!
// $db_user = 'APP_ARCGIS';
// $db_pw_plain = 'tbd';
// $db_pw = 'tbd';

// $db_driver = 'pdo_oci';

// logging
define ( 'DEBUG', true );
$log_path = '../../../igis/logs/';
$igis_error_log = $log_path . 'igis_error_log.php';
$igis_access_log = $log_path . 'igis_access_log.php';

?>