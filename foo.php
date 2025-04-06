<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Private-Network: true");
header("Content-Type: application/json");

$data = array(
   array(
         "name" => "Bethery Vion Madison",
         "year" => "2008",
         "team" => $_SERVER['HTTP_ORIGIN'],
         "sex" => "F",
        "id_athlete" => "270129"));
echo json_encode($data);
exit();

?>
