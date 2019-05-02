DROP DATABASE IF EXISTS `devices_commands`;
CREATE DATABASE `devices_commands`;

use `devices_commands`;

DROP TABLE IF EXISTS `remotes` ;
DROP TABLE IF EXISTS `models` ;
DROP TABLE IF EXISTS `commands` ;
DROP TABLE IF EXISTS `controllers` ;

CREATE TABLE `remotes` (
  `id` int NOT NULL auto_increment,
  `value` varchar(50) NOT null,
  `model` varchar(50) NOT NULL,
  `controller` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB, auto_increment=1;


CREATE TABLE `commands` (
  `id` int NOT NULL auto_increment,
  `class` varchar(50) NOT NULL,
  `code` text NOT NULL,
  `receiver` varchar(50) NOT NULL,
  `remote` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB, auto_increment=1;

CREATE TABLE `models` (
  `name` varchar(50) NOT NULL,
  `description` varchar(100) NOT NULL,
  `genre` varchar(50) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB;

CREATE TABLE `controllers` (
  `name` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB;

INSERT INTO `devices_commands`.`models` (`name`, `description`,`genre`) VALUES ('modello1', 'Modello per televisori', 'televisori');
INSERT INTO `devices_commands`.`models` (`name`, `description`,`genre`) VALUES ('mod_stereo', 'Modello per radio, stereo', 'stereo');
INSERT INTO `devices_commands`.`models` (`name`, `description`,`genre`) VALUES ('mod_condizionatore', 'Modello per condizionatori', 'condizionatori');
INSERT INTO `devices_commands`.`models` (`name`, `description`,`genre`) VALUES ('modello3', 'Modello per Monitor/Decoder con frecce e gestione menu', 'televisori');

INSERT INTO `devices_commands`.`controllers` (`name`, `ip`) VALUES ('nodemcu_1', '192.168.1.15');

INSERT INTO `devices_commands`.`remotes` (`value`,`model`,`controller`) VALUES ('LG genrale', 'modello3','nodemcu_1');