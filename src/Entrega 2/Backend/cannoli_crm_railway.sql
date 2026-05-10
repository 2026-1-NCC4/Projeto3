-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: cannoli_crm
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `cannoli_crm`
--



USE `railway`;

--
-- Table structure for table `admin_settings`
--

DROP TABLE IF EXISTS `admin_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_plataforma` varchar(100) NOT NULL DEFAULT 'Cannoli CRM',
  `email_suporte` varchar(150) NOT NULL DEFAULT 'suporte@cannolicrm.com',
  `limite_recorrencia` decimal(5,2) NOT NULL DEFAULT 25.00,
  `limite_ticket_medio` decimal(10,2) NOT NULL DEFAULT 40.00,
  `limite_queda_receita` decimal(5,2) NOT NULL DEFAULT 15.00,
  `alertas_criticos` tinyint(1) NOT NULL DEFAULT 1,
  `recalculo_automatico` tinyint(1) NOT NULL DEFAULT 1,
  `permitir_convites` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_settings`
--

LOCK TABLES `admin_settings` WRITE;
/*!40000 ALTER TABLE `admin_settings` DISABLE KEYS */;
INSERT INTO `admin_settings` VALUES (1,'Cannoli CRM','suporte@cannolicrm.com',30.00,40.00,15.00,1,1,1,'2026-05-03 23:34:23','2026-05-04 00:50:05');
/*!40000 ALTER TABLE `admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('cashback','discount','reactivation','upsell') NOT NULL,
  `status` enum('draft','active','finished') DEFAULT 'draft',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_campaigns_company` (`company_id`),
  CONSTRAINT `fk_campaigns_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collaborator_invites`
--

DROP TABLE IF EXISTS `collaborator_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `collaborator_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `invite_code` varchar(20) NOT NULL,
  `status` enum('active','inactive','used') DEFAULT 'active',
  `used_by_user_id` int(11) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `fk_collaborator_invites_company` (`company_id`),
  KEY `fk_collaborator_invites_user` (`used_by_user_id`),
  CONSTRAINT `fk_collaborator_invites_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collaborator_invites_user` FOREIGN KEY (`used_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collaborator_invites`
--

LOCK TABLES `collaborator_invites` WRITE;
/*!40000 ALTER TABLE `collaborator_invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `collaborator_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `cnpj` varchar(14) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `external_store_id` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `invited_at` datetime DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'Higor','14796606000190',NULL,NULL,'active',NULL,NULL,'2026-05-02 14:32:44'),(2,'Elvi Cozinhas Profissional',NULL,NULL,'069768C1-6Fdd-4833-939E-Ea9F51A7Dff9','active',NULL,NULL,'2026-05-07 23:54:35'),(3,'Atelier Doce Amor',NULL,NULL,'42C3B4Ba-0F3B-457A-8F36-5Cc42Dedf94C','active',NULL,NULL,'2026-05-07 23:54:35'),(4,'Casa Da Esfiha Vila Gustavo Ltda',NULL,NULL,'B6Bc362F-Cb27-44Ac-A9C8-5E9B08263F86','active',NULL,NULL,'2026-05-07 23:54:35'),(5,'Padaria Century',NULL,NULL,'01Ac4Ec3-F7E0-451D-Ab31-2Db1799816Ca','active',NULL,NULL,'2026-05-07 23:54:35'),(6,'Casa Da Esfiha Jardim JapÃ£o',NULL,NULL,'0C02619D-0C57-492D-9660-Dd0F357A2F0C','active',NULL,NULL,'2026-05-07 23:54:35'),(7,'Vida Leve',NULL,NULL,'9B4Bf8Bf-2F5C-4680-Afe1-8014B371D518','active',NULL,NULL,'2026-05-07 23:54:35'),(8,'Burguer For You','33723179000164','anomiolargadobarata@gmail.com','8Eccb620-5990-433F-8C9B-D77D0F1Da591','active','2026-05-08 15:38:32','2026-05-08 15:39:41','2026-05-07 23:54:35'),(9,'Cannoli Food Cashback',NULL,NULL,'3F0Dba5F-C1F2-4C74-B8B4-318Eff71031C','active',NULL,NULL,'2026-05-07 23:54:35'),(10,'Cannoli Food Datamaxi',NULL,NULL,'1167E267-F93C-47Bb-9807-79387Acdacfd','active',NULL,NULL,'2026-05-07 23:54:35'),(11,'Sai Burguer',NULL,NULL,'0D860437-8F2F-4437-A866-811Bd07Ac367','active',NULL,NULL,'2026-05-07 23:54:35'),(12,'Ponto Da Esfiha - Itapecerica Da Serra',NULL,NULL,'1Caf86A9-Bab9-42B1-8A47-7A3F9E24F805','active',NULL,NULL,'2026-05-07 23:54:35'),(13,'Pizzaria Do Patrao',NULL,NULL,'2F89Fa97-27Cb-424C-A55C-31A8D4019551','active',NULL,NULL,'2026-05-07 23:54:35'),(14,'Anderson Camargo',NULL,NULL,'A6A267A8-E71B-4935-Ac9F-B778Eb739Fd4','active',NULL,NULL,'2026-05-07 23:54:35'),(15,'Sorvetes Italia',NULL,NULL,'45F9Fac9-7A83-4Da2-9011-39816A4Bf0A8','active',NULL,NULL,'2026-05-07 23:54:35'),(16,'Jbbl Choperia',NULL,NULL,'74358477-B282-482A-Ab5A-69Dea060Fc35','active',NULL,NULL,'2026-05-07 23:54:35'),(17,'Dona Baunilha',NULL,NULL,'3Da392C6-86E3-4847-8A04-0Cdae0E501F9','active',NULL,NULL,'2026-05-07 23:54:35'),(18,'Nicolas Franco Monteiro',NULL,NULL,'6E59Cea6-7A9F-43C1-A72E-67915A8F1B1C','active',NULL,NULL,'2026-05-07 23:54:35'),(19,'Food Service',NULL,NULL,'1Af0098B-1276-47Db-95E5-8Ef8D43878B5','active',NULL,NULL,'2026-05-07 23:54:35'),(20,'Lf - Cpg - Norte Sul Plaza',NULL,NULL,'92E0B17F-C94B-445A-A36E-207220Bf3E08','active',NULL,NULL,'2026-05-07 23:54:35'),(21,'Bolos Miraculosos',NULL,NULL,'9E69D92E-Fff3-4500-B77A-C429Cc312Da5','active',NULL,NULL,'2026-05-07 23:54:35'),(22,'Filipa EmpÃ³rio E Restaurante',NULL,NULL,'5818Afa9-3322-45A6-Bc5B-5D19E6Ea1F25','active',NULL,NULL,'2026-05-07 23:54:35'),(23,'Loja Modelo',NULL,NULL,'B70F7Bdc-3543-459B-9312-6A108Aa3F117','active',NULL,NULL,'2026-05-07 23:54:35'),(24,'SÃ£o JoÃ£o Vilela',NULL,NULL,'Dbac911D-086E-4612-8Fac-Db980D0F7A63','active',NULL,NULL,'2026-05-07 23:54:35'),(25,'SÃ£o JoÃ£o Da Penha',NULL,NULL,'8B04A4D8-A0E4-4F9C-9272-5250326A10Af','active',NULL,NULL,'2026-05-07 23:54:35'),(26,'Leo\'S Pizzas',NULL,NULL,'5F30B411-Fad3-437C-88B4-Ca78C96A13E7','active',NULL,NULL,'2026-05-07 23:54:35'),(27,'ManÃ¡ Burger',NULL,NULL,'39946E25-8Ac3-43A4-8010-C883D2E0C637','active',NULL,NULL,'2026-05-07 23:54:35'),(28,'AustrÃ¡lia Hamburgueria Artesanal',NULL,NULL,'1E31B67E-621C-4915-9Fb2-67B918F3D6D6','active',NULL,NULL,'2026-05-07 23:54:35'),(29,'Ponto Da Esfiha - Cachoeirinha',NULL,NULL,'2D5C651A-B787-41A5-8A82-Bd7Bf844B64B','active',NULL,NULL,'2026-05-07 23:54:35'),(30,'Loja Do Samuel',NULL,NULL,'9698049A-9F42-42E5-Afe4-6566C3Bbea07','active',NULL,NULL,'2026-05-07 23:54:35'),(31,'AÃ§aÃ­ DugoiÃ¡s',NULL,NULL,'D0B78249-59B8-4C16-B40C-B084B8Aa371E','active',NULL,NULL,'2026-05-07 23:54:35'),(32,'Marinara Pizzaria & Restaurante',NULL,NULL,'Aefd1124-D1D3-40A6-9B06-7F74Bfa58Fba','active',NULL,NULL,'2026-05-07 23:54:35'),(33,'Delivery Do Salesio',NULL,NULL,'17A0899A-73Bd-4Af5-8082-0Eb551650F26','active',NULL,NULL,'2026-05-07 23:54:35'),(34,'Nutreon Labs',NULL,NULL,'573Da7Db-86Cb-41Ce-8Eab-990Fc4D25Dbd','active',NULL,NULL,'2026-05-07 23:54:35'),(35,'Casa Da Esfiha - Guarulhos',NULL,NULL,'C979E8B2-8Ff6-4Ddf-Bb83-0218348A7C3B','active',NULL,NULL,'2026-05-07 23:54:35'),(36,'Veneto Pizzaria',NULL,NULL,'21E1A735-Bfd6-40B6-Bbe1-35889F94Fadb','active',NULL,NULL,'2026-05-07 23:54:35'),(37,'Caldo Bom Do Mateus',NULL,NULL,'483Af9D2-7C76-4B9B-Ae0F-81Ef7F021568','active',NULL,NULL,'2026-05-07 23:54:35'),(38,'Lf - Sbc - Atacadao Centro',NULL,NULL,'4F22F901-8089-4555-B131-Adb9B724A343','active',NULL,NULL,'2026-05-07 23:54:35'),(39,'Agustina Restaurante E EmpÃ³rio',NULL,NULL,'13B738E0-614F-4Fe2-9982-6D88867Bfa5A','active',NULL,NULL,'2026-05-07 23:54:35'),(40,'Trailer Do Pops - F J Melo Junior',NULL,NULL,'125764B3-4916-4326-9C6B-D1F7B2Ffdc57','active',NULL,NULL,'2026-05-07 23:54:35'),(41,'Cannoli Food Cashback Iii',NULL,NULL,'1092E75C-Afb5-4992-869A-8D15C195A7C2','active',NULL,NULL,'2026-05-07 23:54:35'),(42,'Polpanorte - P9 Arvores',NULL,NULL,'0F8A86Cb-Dd5B-4Edd-8558-Be543B1620B1','active',NULL,NULL,'2026-05-07 23:54:35'),(43,'Central Das Esfihas - CangaÃ­ba',NULL,NULL,'C752E0Af-D9D0-4F2E-A4B9-1D94B4F58493','active',NULL,NULL,'2026-05-07 23:54:35'),(44,'Lf - Ppb - Prudenshopping',NULL,NULL,'794C6C63-Da08-42A6-8Efb-205595089B8C','active',NULL,NULL,'2026-05-07 23:54:35'),(45,'Giralda Doceria',NULL,NULL,'6E240E72-2948-443E-Bf4A-23243C0721D0','active',NULL,NULL,'2026-05-07 23:54:35'),(46,'Lf - Cambe - Outlet Center',NULL,NULL,'260231Be-A964-48Bb-Bf2E-A0C3A0Dbeca4','active',NULL,NULL,'2026-05-07 23:54:35'),(47,'Cerrado ImÃ³veis',NULL,NULL,'2Fdc6149-Fbf3-442D-88Fe-C8375A86266D','active',NULL,NULL,'2026-05-07 23:54:35'),(48,'Lp - Mgf - MaringÃ¡ Park',NULL,NULL,'B420E889-0A10-4A3D-Bc0B-12Ae5B50D84E','active',NULL,NULL,'2026-05-07 23:54:35'),(49,'Codgox',NULL,NULL,'1207Abf9-C860-40Dd-A053-484539E76005','active',NULL,NULL,'2026-05-07 23:54:35'),(50,'A Rainha Do Frango','11222333000181','higurcegs@gmail.com','F28B08C9-2101-48A5-A27F-2585F2Bf6823','active','2026-05-07 22:10:08','2026-05-07 22:13:32','2026-05-07 23:54:35'),(51,'Lp - Maringa - Willie Davids',NULL,NULL,'6Dad43B9-E9E2-4318-94D8-800Ece3Fdea2','active',NULL,NULL,'2026-05-07 23:54:35'),(52,'Padaria VitÃ³ria RÃ©gia',NULL,NULL,'1Fcd01E3-2Dba-4Af8-Ae58-C39060F3E575','active',NULL,NULL,'2026-05-07 23:54:35'),(53,'DemonstraÃ§Ã£o',NULL,NULL,'4Ba8925F-94Ab-4Bed-97B7-B07A22B6D31F','active',NULL,NULL,'2026-05-07 23:54:35'),(54,'Gran Royalle',NULL,NULL,'8C4E96A9-A7B8-4B4C-A891-F600C9Eceee5','active',NULL,NULL,'2026-05-07 23:54:35'),(55,'Padaria Silvana',NULL,NULL,'106Cd2Af-2375-40D3-Ab22-0172926F95F6','active',NULL,NULL,'2026-05-07 23:54:35'),(56,'La Brunet Paes E Doces Pedro Doll Ltda',NULL,NULL,'5325Fbf9-22E9-4C68-8E42-8C740E9Eec32','active',NULL,NULL,'2026-05-07 23:54:35'),(57,'Casa Da Mae Joana Pizzaria Ltda',NULL,NULL,'0D756Ccf-7F47-4D8D-A2Fb-Aa78226A401D','active',NULL,NULL,'2026-05-07 23:54:35'),(58,'Machado & Rodrigues Food Ltda',NULL,NULL,'Fd5Bc963-Ff69-40C4-B5D8-1709E233Fe02','active',NULL,NULL,'2026-05-07 23:54:35'),(59,'Polpanorte - Quadras',NULL,NULL,'E67A239E-9524-4865-B644-8Dd0Bddd2Bb1','active',NULL,NULL,'2026-05-07 23:54:35'),(60,'Polpanorte - Parquinho',NULL,NULL,'86256660-0078-49C2-88D6-E0Bf52Be1A5B','active',NULL,NULL,'2026-05-07 23:54:35'),(61,'Polpanorte - Pacubra',NULL,NULL,'Dfdeb26D-2695-40Fc-A518-57Bf4Aa4E81C','active',NULL,NULL,'2026-05-07 23:54:35'),(62,'Polpanorte - SÃ£o JosÃ© Dos Pinhais',NULL,NULL,'6F70Cd42-25Eb-4F6B-994D-A134156F70Fe','active',NULL,NULL,'2026-05-07 23:54:35'),(63,'Polpanorte - Goiania',NULL,NULL,'9Fbcb539-D291-43E2-A1B7-6E864C230B2D','active',NULL,NULL,'2026-05-07 23:54:35'),(64,'Mordidela Balsas',NULL,NULL,'8Cc52834-D064-4C6A-8E08-8F33D4811872','active',NULL,NULL,'2026-05-07 23:54:35'),(65,'Padaria Villa Real',NULL,NULL,'392C030B-95A1-42C9-B08C-C9C64Eed1246','active',NULL,NULL,'2026-05-07 23:54:35'),(66,'Polpanorte - Londrina',NULL,NULL,'1D376C83-8D4C-4273-Bb83-E0B7A7080041','active',NULL,NULL,'2026-05-07 23:54:35'),(67,'Polpanorte - Campo Grande',NULL,NULL,'A8Ad2209-4A89-4802-8Bf1-E30F999A3982','active',NULL,NULL,'2026-05-07 23:54:35'),(68,'Polpanorte - Caceres',NULL,NULL,'1Fc00824-25Fd-4D94-Ad69-5B95Cb468A43','active',NULL,NULL,'2026-05-07 23:54:35'),(69,'Polpanorte - Shopping Ibirapuera',NULL,NULL,'Ad90C57D-5C1D-4C39-A749-9Bd728F2C772','active',NULL,NULL,'2026-05-07 23:54:35'),(70,'Polpanorte - Balneario Shopping',NULL,NULL,'0C9B05F1-4F62-4513-A8E9-30964E1A5E4E','active',NULL,NULL,'2026-05-07 23:54:35'),(71,'Cannoli Food Cashback Ii',NULL,NULL,'6A086D6C-89F1-404D-98D8-1D2F3559E7B2','active',NULL,NULL,'2026-05-07 23:54:35'),(72,'Lf - Umuarama - Av Parana',NULL,NULL,'9Df6847D-7296-4A38-92E9-0Ef12Fed73Eb','active',NULL,NULL,'2026-05-07 23:54:35'),(73,'Polpanorte - Horto',NULL,NULL,'0100729C-1Bce-4809-96B7-896Eb9Dbe599','active',NULL,NULL,'2026-05-07 23:54:35'),(74,'Padaria Maria AmÃ¡lia',NULL,NULL,'F7A936Fb-644A-436B-8907-7846B067865E','active',NULL,NULL,'2026-05-07 23:54:35'),(75,'Pizzaria Valentina',NULL,NULL,'45A5Cbf8-Bd4F-464A-B0E7-A03E0Ada659F','active',NULL,NULL,'2026-05-07 23:54:35'),(76,'Bode DÃº Burger','77489892000160','jaegcostaestheroliveira@gmail.com','99792B54-3864-420B-A5Df-354Ff67Ca28D','active','2026-05-08 14:54:33','2026-05-08 14:58:06','2026-05-07 23:54:35'),(77,'Empresa Teste',NULL,NULL,'97674906-E4Bb-47Cf-9D9E-4Ebd7F4Ee919','active',NULL,NULL,'2026-05-07 23:54:35'),(78,'Pizza B',NULL,NULL,'4Bb014Bb-8B1D-489A-Aded-2060F3Fda27E','active',NULL,NULL,'2026-05-07 23:54:35');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_invites`
--

DROP TABLE IF EXISTS `company_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `invite_code` varchar(20) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `used_by_user_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_invites_invite_code` (`invite_code`),
  KEY `idx_company_invites_company_id` (`company_id`),
  KEY `idx_company_invites_email` (`email`),
  KEY `fk_company_invites_used_by` (`used_by_user_id`),
  CONSTRAINT `fk_company_invites_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_invites_used_by` FOREIGN KEY (`used_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_invites`
--

LOCK TABLES `company_invites` WRITE;
/*!40000 ALTER TABLE `company_invites` DISABLE KEYS */;
INSERT INTO `company_invites` VALUES (1,50,'higurcegs@gmail.com','208333','inactive','2026-05-14 22:10:08','2026-05-07 22:13:32',4,'2026-05-07 22:10:08'),(2,76,'jaegcostaestheroliveira@gmail.com','594965','inactive','2026-05-15 14:54:33','2026-05-08 14:58:06',5,'2026-05-08 14:54:33'),(3,8,'anomiolargadobarata@gmail.com','551044','inactive','2026-05-15 15:38:32','2026-05-08 15:39:41',6,'2026-05-08 15:38:32');
/*!40000 ALTER TABLE `company_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_customers_company` (`company_id`),
  CONSTRAINT `fk_customers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,1,'Cliente Mock 2','cliente-mock-1778340551452-2@cannoli.local','11999999999','2026-05-09 15:29:11');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs_importacao_dados`
--

DROP TABLE IF EXISTS `logs_importacao_dados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs_importacao_dados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_arquivo` varchar(255) NOT NULL,
  `tipo_arquivo` varchar(50) NOT NULL,
  `origem` varchar(100) DEFAULT 'upload_admin',
  `total_linhas` int(11) DEFAULT 0,
  `linhas_aceitas` int(11) DEFAULT 0,
  `linhas_rejeitadas` int(11) DEFAULT 0,
  `linhas_duplicadas` int(11) DEFAULT 0,
  `campos_faltantes` int(11) DEFAULT 0,
  `status_processamento` varchar(50) DEFAULT 'processado',
  `mensagem_erro` text DEFAULT NULL,
  `usuario_importador_id` int(11) DEFAULT NULL,
  `iniciado_em` datetime DEFAULT current_timestamp(),
  `finalizado_em` datetime DEFAULT NULL,
  `criado_em` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs_importacao_dados`
--

LOCK TABLES `logs_importacao_dados` WRITE;
/*!40000 ALTER TABLE `logs_importacao_dados` DISABLE KEYS */;
INSERT INTO `logs_importacao_dados` VALUES (1,'teste_importacao_pedidos.xlsx','xlsx','pedidos',5,3,1,1,1,'processado_com_alertas',NULL,2,'2026-05-04 12:42:58','2026-05-04 12:42:58','2026-05-04 12:42:58'),(2,'teste_importacao_pedidos_incremental.csv','csv','pedidos',3,2,0,1,0,'processado_com_alertas',NULL,2,'2026-05-04 14:11:43','2026-05-04 14:11:43','2026-05-04 14:11:43'),(3,'teste_importacao_pedidos_incremental (1).csv','csv','pedidos',3,0,0,3,0,'processado_com_alertas',NULL,2,'2026-05-04 14:13:42','2026-05-04 14:13:42','2026-05-04 14:13:42'),(4,'base_teste_importacao_incremental_pedidos.csv','csv','pedidos',4,3,0,1,0,'processado_com_alertas',NULL,2,'2026-05-04 14:25:45','2026-05-04 14:25:45','2026-05-04 14:25:45');
/*!40000 ALTER TABLE `logs_importacao_dados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `order_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_orders_company` (`company_id`),
  KEY `fk_orders_customer` (`customer_id`),
  CONSTRAINT `fk_orders_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (3,1,1,154.45,'2026-05-09 12:29:11','2026-05-09 15:29:11'),(4,1,1,176.11,'2026-05-09 12:29:11','2026-05-09 15:29:11'),(5,1,1,238.24,'2026-05-09 13:06:34','2026-05-09 16:06:34'),(6,1,1,155.37,'2026-05-09 13:06:34','2026-05-09 16:06:34'),(7,1,1,199.70,'2026-05-09 13:16:07','2026-05-09 16:16:07'),(8,1,1,148.31,'2026-05-09 13:16:07','2026-05-09 16:16:07'),(9,1,1,184.77,'2026-05-09 13:16:07','2026-05-09 16:16:07'),(10,1,1,216.26,'2026-05-09 13:16:07','2026-05-09 16:16:07'),(11,1,1,208.91,'2026-05-09 13:35:21','2026-05-09 16:35:21'),(12,1,1,185.28,'2026-05-09 13:35:21','2026-05-09 16:35:21'),(13,1,1,215.45,'2026-05-09 13:35:21','2026-05-09 16:35:21'),(14,1,1,214.84,'2026-05-09 15:05:40','2026-05-09 18:05:40'),(15,1,1,170.71,'2026-05-09 15:50:32','2026-05-09 18:50:32'),(16,1,1,213.16,'2026-05-09 16:50:31','2026-05-09 19:50:31');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `reset_code` varchar(10) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_password_reset_user` (`user_id`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,1,'8285602a23543b829fa92d6922feb35d38af47c77f9a8133c1a38df6c6584af4',NULL,'2026-05-02 11:51:36',NULL,'2026-05-02 14:36:36'),(2,1,'6f8c4e1ba88766ebd595350843dc70f43a1735ffb02f90e761ad99df01550688',NULL,'2026-05-02 13:40:26',NULL,'2026-05-02 16:25:26'),(3,1,'a0b4d4a0d4e30853917bf2711769a13522bbefddadebd3ffe9b63b03dcc2a6a8',NULL,'2026-05-02 13:41:06',NULL,'2026-05-02 16:26:06'),(4,1,'bdeb5f79f0b2b752bbf486dfee330c9143e8d260e74f6655e83bd707b1ace75a','235614','2026-05-02 13:54:12',NULL,'2026-05-02 16:39:12'),(5,1,'5f76c2658feea3bfe2e526ffe7d2f45221fa6fe17cb986d19f7380f0dddda992','812716','2026-05-02 14:08:28',NULL,'2026-05-02 16:53:28'),(6,1,'ee1f3e4723d38cc8844a80b6ef28fc7dc5e24da8e92339f644e762eff3e62339','920477','2026-05-02 14:58:31','2026-05-02 14:44:38','2026-05-02 17:43:31'),(7,1,'23e32362e10b017a7d07d6735baea424c0a9ed714b415fb68c28a2545d2796a5','900015','2026-05-02 15:02:26',NULL,'2026-05-02 17:47:26'),(8,1,'2b2059073e129082589f2d46be2226dae16d4f7946f6d0ea3879730e1ff4fba6','980722','2026-05-02 15:04:08','2026-05-02 14:50:09','2026-05-02 17:49:08'),(9,1,'0e26dc90e3728b3378bb2ffb0c83a3864eabbb619151a5cedc1672a879b7223e','817225','2026-05-07 20:10:14',NULL,'2026-05-07 22:55:14');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_invites`
--

DROP TABLE IF EXISTS `staff_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff_invites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `invite_code` varchar(20) NOT NULL,
  `status` enum('active','inactive','used') DEFAULT 'active',
  `used_by_user_id` int(11) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `fk_staff_invites_user` (`used_by_user_id`),
  CONSTRAINT `fk_staff_invites_user` FOREIGN KEY (`used_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_invites`
--

LOCK TABLES `staff_invites` WRITE;
/*!40000 ALTER TABLE `staff_invites` DISABLE KEYS */;
INSERT INTO `staff_invites` VALUES (1,'esther','oliveiracostaesther@gmail.com','182704','inactive',NULL,'2026-05-09 19:22:00',NULL,'2026-05-02 22:22:00'),(2,'Esther Oliveira Costa','oliveiracostaesther@gmail.com','582368','used',3,'2026-05-09 19:59:32','2026-05-02 20:01:22','2026-05-02 22:59:32'),(3,'Giovanna ','giovannaoliveiracosta62@gmail.com','414088','active',NULL,'2026-05-10 21:12:56',NULL,'2026-05-04 00:12:56');
/*!40000 ALTER TABLE `staff_invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','empresa','colaborador') NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_company` (`company_id`),
  CONSTRAINT `fk_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Higor','higorlfonsecas@gmail.com','$2b$10$YaCAqkfn1ub7nj90.NILH.GShwhV015Q5QbMiRapnSAga6yHWYd.2','empresa','active','2026-05-02 14:32:44'),(2,NULL,'Cannoli CRM','admin@cannolicrm.com','$2b$10$ikJ5kIbUXBkUqiuESydplOp5nNxUpzCgoZ2pXPVtPxjjiM.DV2cMu','admin','active','2026-05-02 22:01:53'),(3,NULL,'Estherr','oliveiracostaesther@gmail.com','$2b$10$AAIKqAlcp20zK6PpXexAxOjrTajyhUIM13oEj8yMuG2snv2U71Bii','colaborador','active','2026-05-02 23:01:22'),(4,50,'Hig','higurcegs@gmail.com','$2b$10$j8asJ0yPOASX4o1nHp4R8uw/.CgsvJPj0CD7wi6K7UJyxh2.quev2','empresa','active','2026-05-08 01:13:32'),(5,76,'Esther','jaegcostaestheroliveira@gmail.com','$2b$10$9bPkxWX4G.mWUMfrgu/lKO2Pd1m7F.2pZZNvLetLC667PYGW62eo.','empresa','active','2026-05-08 17:58:06'),(6,8,'Leo ','anomiolargadobarata@gmail.com','$2b$10$70pLf2dGfIkoPFjvMHVs4.7WzKqJPqtbv6IYshjSumDnRdk2eUa2q','empresa','active','2026-05-08 18:39:41');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'cannoli_crm'
--

--
-- Dumping routines for database 'cannoli_crm'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-09 18:09:26
