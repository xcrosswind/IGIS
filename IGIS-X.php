<?php
require_once "vendor/autoload.php";

set_include_path ( '../../../igis' );
// require ('IGIS-settings-local.php');
require ('IGIS-settings.php');
require ('Encryption_Module.php');
/**
 * This is the class that stores the user selection.
 */
class MyUserSelection {
	private $userSelection;
	public function __construct($post) {
		$this->userSelection = json_decode ( stripslashes ( $post ) );
	}
	public function getUserId() {
		return $this->userSelection->user_id;
	}
	public function getSrcId() {
		return $this->userSelection->src_id;
	}
	public function getTimestamp() {
		return $this->userSelection->timestamp;
	}
	public function getActiveGuid() {
		return $this->userSelection->active_guid;
	}
	public function getActionType() {
		return $this->userSelection->actionType;
	}
	public function getObjects() {
		return $this->userSelection->objects;
	}
}
/**
 * This is the main class that handles requests to the Indigo Database.
 */
class IndigoDB {
	private $myUserSelection;
	private $crypt;
	private $config;
	private $connectionParams = array ();
	private $db;
	private $db_schema;
	private $db_x_selex;
	private $db_x_selexdata;
	private $log_path;
	private $igis_error_log;
	private $igis_access_log;
	//
	public function __construct($myUserSelection, $db_name, $db_user, $db_secret, $db_pw, $db_hostname, $db_port, $db_driver, $db_schema, $db_x_selex, $db_x_selexdata, $log_path, $igis_error_log, $igis_access_log) {
		$this->myUserSelection = $myUserSelection;
		$this->crypt = new encryption_class ();
		$this->config = new \Doctrine\DBAL\Configuration ();
		$this->connectionParams = array (
				'dbname' => $db_name,
				'user' => $db_user,
				'password' => $this->crypt->decrypt ( $db_secret, $db_pw ),
				'host' => $db_hostname,
				'port' => $db_port,
				'driver' => $db_driver 
		);
		$this->db = \Doctrine\DBAL\DriverManager::getConnection ( $this->connectionParams, $this->config );
		$this->db_schema = $db_schema;
		$this->db_x_selex = $db_x_selex;
		$this->db_x_selexdata = $db_x_selexdata;
		$this->log_path = $log_path;
		$this->igis_error_log = $igis_error_log;
		$this->igis_access_log = $igis_access_log;
	}
	public function handleRequest() {
		if ($this->myUserSelection->getActionType () == 1) {
			// get selex_id from the user's previous session
			// $prevSessionSelex_id = getPrevSessionSelexId ();
			// if (! $prevSessionSelex_id) {
			// // no selection is found for this user
			// // add entry in x_selex table for current session
			// insertIntoSelex ();
			// // get selex_id for the user's current session
			// $selex_id = getSelexId ();
			// // add entries in x_selexdata table
			// addSelexData ( $selex_id, $objects );
			// } else {
			// // found selection => get the user's previous object selection
			// $prevSelectionObjects [] = array ();
			// $prevSelectionObjects = getPrevSessionSelectionObjects ( $prevSessionSelex_id );
			// // add entry in x_selex table for current session
			// insertIntoSelex ();
			// // get selex_id for the user's current session
			// $selex_id = getSelexId ();
			// // add entries in x_selexdata table
			// addSelexData ( $selex_id, $prevSelectionObjects );
			// }
			
			// add entry in x_selex table
			$this->insertIntoSelex ();
			// get selex_id (sequence value)
			$selex_id = $this->getSelexId ();
			// add entries in x_selexdata table
			$this->addSelexData ( $selex_id, $this->myUserSelection->getObjects () );
		} elseif ($this->myUserSelection->getActionType () == 2) {
			// get selex_id (sequence value)
			$selex_id = $this->getSelexId ();
			// remove complete previous selection if last user selection is NOT empty
			if (count ( $this->myUserSelection->getObjects () ) > 0) {
				$this->delSelexData ( $selex_id );
			}
			// add entries in x_selexdata table
			$this->addSelexData ( $selex_id, $this->myUserSelection->getObjects () );
		} else {
			echo "We are in trouble!";
		}
	}
	
	/**
	 * Returns a user's last object selection of the user's previous session.
	 * The function is unused at the moment.
	 *
	 * @param integer $prevSessionSelex_id
	 *        	The user's Selex Id of the user's previous session.
	 * @return array Selected objects.
	 */
	private function getPrevSessionSelectionObjects($prevSessionSelex_id) {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		$queryBuilder->select ( 'obj_id' );
		$queryBuilder->from ( $this->db_schema . "." . $this->db_x_selexdata ); // TODO: check this for Orcale!
		$queryBuilder->where ( 'selex_id = ?' );
		$queryBuilder->setParameter ( 0, $prevSessionSelex_id );
		
		$sql = $queryBuilder->getSQL ();
		DEBUG ? error_log ( $sql . "\n", 3, $this->igis_access_log ) : null;
		
		$objects [] = array ();
		try {
			$results = $queryBuilder->execute ();
			while ( $row = $results->fetch ( PDO::FETCH_ASSOC ) ) {
				array_push ( $objects [], $row ['obj_id'] );
			}
			// DEBUG ? error_log ( $selex_id . "\n", 3, $GLOBALS ["igis_access_log"] ) : null;
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
		}
		
		return $objects;
	}
	/**
	 * Returns a user's Selex Id of the user's previous session.
	 * The function is unused at the moment.
	 *
	 * @return Integer The user's previous Selex Id.
	 */
	private function getPrevSessionSelexId() {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		$queryBuilder->select ( 'selex_id', 'MAX(time_stamp) AS ts' );
		$queryBuilder->from ( $this->db_schema . "." . $this->db_x_selex ); // TODO: check this for Orcale!
		$queryBuilder->where ( 'user_id = ?' );
		$queryBuilder->andwhere ( 'src_id = ?' );
		$queryBuilder->andwhere ( 'active_guid = ?' );
		$queryBuilder->setParameter ( 0, $this->myUserSelection->getUserId () );
		$queryBuilder->setParameter ( 1, $this->myUserSelection->getSrcId () );
		$queryBuilder->setParameter ( 3, $this->myUserSelection->getActiveGuid () );
		
		$sql = $queryBuilder->getSQL ();
		DEBUG ? error_log ( $sql . "\n", 3, $this->igis_access_log ) : null;
		
		$selex_id = - 1;
		try {
			$results = $queryBuilder->execute ();
			// Returns a single column from the next row of a result set or FALSE if there are no more rows.
			$selex_id = $results->fetchColumn ();
			DEBUG ? error_log ( $selex_id . "\n", 3, $this->igis_access_log ) : null;
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
		}
		
		return $selex_id;
	}
	/**
	 * Creates a new entry in table bto_shogun.x_selex.
	 */
	private function insertIntoSelex() {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		$queryBuilder->insert ( $this->db_schema . "." . $this->db_x_selex ); // TODO: check this for Orcale!
		$queryBuilder->values ( array (
				'user_id' => '?',
				'src_id' => '?',
				'time_stamp' => '?',
				'active_guid' => '?' 
		) );
		$queryBuilder->setParameter ( 0, $this->myUserSelection->getUserId () );
		$queryBuilder->setParameter ( 1, $this->myUserSelection->getSrcId () );
		// timestamp format 2015-03-16 09:52:09
		$date = new DateTime ( $this->myUserSelection->getTimestamp () );
		$queryBuilder->setParameter ( 2, $date->format ( "Y-m-d H:i:s" ) );
		$queryBuilder->setParameter ( 3, $this->myUserSelection->getActiveGuid () );
		
		$sql = $queryBuilder->getSQL ();
		DEBUG ? error_log ( $sql . "\n", 3, $this->igis_access_log ) : null;
		
		try {
			$result = $queryBuilder->execute ();
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
		}
	}
	/**
	 * Returns a user's Selex Id of the user's current session.
	 *
	 * @return Integer The user's Selex Id.
	 */
	private function getSelexId() {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		$queryBuilder->select ( 'selex_id' );
		$queryBuilder->from ( $this->db_schema . "." . $this->db_x_selex ); // TODO: check this for Orcale!
		$queryBuilder->where ( 'user_id = ?' );
		$queryBuilder->andwhere ( 'src_id = ?' );
		$queryBuilder->andwhere ( 'time_stamp = ?' );
		$queryBuilder->andwhere ( 'active_guid = ?' );
		$queryBuilder->setParameter ( 0, $this->myUserSelection->getUserId () );
		$queryBuilder->setParameter ( 1, $this->myUserSelection->getSrcId () );
		$queryBuilder->setParameter ( 2, $this->myUserSelection->getTimestamp () );
		$queryBuilder->setParameter ( 3, $this->myUserSelection->getActiveGuid () );
		
		$sql = $queryBuilder->getSQL ();
		DEBUG ? error_log ( $sql . "\n", 3, $this->igis_access_log ) : null;
		
		$selex_id = - 1;
		try {
			$results = $queryBuilder->execute ();
			$selex_id = $results->fetchColumn ();
			DEBUG ? error_log ( $selex_id . "\n", 3, $this->igis_access_log ) : null;
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
		}
		
		return $selex_id;
	}
	/**
	 * Adds entries in bto_shogun.x_selexdata
	 *
	 * @param integer $selex_id
	 *        	The user's Selex Id.
	 * @param array $objects
	 *        	The object's to be added.
	 */
	private function addSelexData($selex_id, $objects) {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		foreach ( $objects as $o ) {
			$queryBuilder->insert ( $this->db_schema . "." . $this->db_x_selexdata ); // TODO: check this for Orcale!
			$queryBuilder->values ( array (
					'selex_id' => '?',
					'obj_id' => '?' 
			) );
			$queryBuilder->setParameter ( 0, $selex_id );
			$queryBuilder->setParameter ( 1, $o );
			
			try {
				$result = $queryBuilder->execute ();
			} catch ( Exception $e ) {
				error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
			}
		}
	}
	/**
	 * Removes entries from bto_shogun.x_selexdata
	 *
	 * @param integer $selex_id
	 *        	The user's Selex Id.
	 */
	private function delSelexData($selex_id) {
		$queryBuilder = $this->db->createQueryBuilder ();
		
		$queryBuilder->delete ( $this->db_schema . "." . $this->db_x_selexdata ); // TODO: check this for Orcale!
		$queryBuilder->where ( 'selex_id = ?' );
		$queryBuilder->setParameter ( 0, $selex_id );
		
		try {
			$result = $queryBuilder->execute ();
		} catch ( Exception $e ) {
			error_log ( $e->getMessage () . "\n", 3, $this->igis_error_log );
		}
	}
}

$myUserSelection = new MyUserSelection ( $_POST ['userSelection'] );

$myIndigoDB = new IndigoDB ( $myUserSelection, $db_name, $db_user, $db_secret, $db_pw, $db_hostname, $db_port, $db_driver, $db_schema, $db_x_selex, $db_x_selexdata, $log_path, $igis_error_log, $igis_access_log );
$myIndigoDB->handleRequest ();

unset ( $myUserSelection );
unset ( $myIndigoDB );
unset ( $_POST );
?>