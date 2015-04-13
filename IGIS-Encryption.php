<?php
set_include_path ( '../../../igis' );
require ('IGIS-settings.php');
require ('Encryption_Module.php');

/**
 * Note that the salt here is randomly generated.
 * Never use a static salt or one that is not randomly generated.
 *
 * For the VAST majority of use-cases, let password_hash generate the salt randomly for you
 */

$crypt = new encryption_class ();

// $crypt->setAdjustment ( 1.75 ); // 1st adjustment value (optional)
// $crypt->setModulus ( 3 ); // 2nd adjustment value (optional)

// $minSpecifiedLength = 512;

$encrypt_result = $crypt->encrypt ( $db_secret, $db_pw_plain );
// $decrypt_result = $crypt->decrypt ( $db_secret, $db_pw );

echo "enc = " . "\"" . addslashes ( $encrypt_result ) . "\"" . "\n\n\n";
// echo "plain = " . $decrypt_result . "\n\n\n";

?>