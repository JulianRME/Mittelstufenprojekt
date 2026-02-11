# ZeitStempel - Setup

## 1. Datenbank einrichten
1. XAMPP starten (Apache + MySQL)
2. phpMyAdmin öffnen: http://localhost/phpmyadmin
3. `database.sql` importieren

**Standard-Login:** admin@zeitstempel.de / password

## 2. Backend starten
```bash
cd backend
npm install
node server.js
```
Server läuft auf http://localhost:3001

## 3. App öffnen
Browser: http://localhost:3001
Handy (gleiches Netzwerk): http://DEINE-PC-IP:3001

## 4. Zugriff von außen
- Router: Port 3001 auf lokale IP weiterleiten
- DynDNS einrichten (z.B. noip.com) für feste Domain
- Im Handy-Browser die DynDNS-URL öffnen
- "Zum Startbildschirm hinzufügen" für PWA-Installation

## 5. Arduino einrichten
1. Arduino IDE installieren
2. Board "ESP32S3 Dev Module" auswählen
3. Libraries installieren: MFRC522, TFT_eSPI, ArduinoJson
4. In `stempeluhr.ino` WLAN-Daten und Server-IP eintragen
5. TFT_eSPI Library konfigurieren (User_Setup.h für dein Display)
6. Hochladen

## 6. Stempeluhr registrieren
1. Als Admin einloggen
2. Stempeluhren → "Gerät registrieren"
3. ID eingeben (muss mit DEVICE_ID im Arduino-Code übereinstimmen)

## 7. NFC-Tags zuweisen
1. Stempeluhren → Gerät und Mitarbeiter wählen → "Zuweisungsmodus aktivieren"
2. NFC-Tag an die Stempeluhr halten
3. Fertig – Tag ist dem Mitarbeiter zugeordnet
