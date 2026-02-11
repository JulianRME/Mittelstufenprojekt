#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <TFT_eSPI.h>
#include <ArduinoJson.h>

// ===== KONFIGURATION =====
#define DEVICE_ID     "stempeluhr-1"
#define WIFI_SSID     "DEIN_WLAN_NAME"
#define WIFI_PASS     "DEIN_WLAN_PASSWORT"
#define SERVER_URL    "http://DEINE_SERVER_IP:3001"

// NFC Pins (HSPI)
#define NFC_SS    5
#define NFC_RST   4
#define NFC_SCK   36
#define NFC_MOSI  35
#define NFC_MISO  37

SPIClass hspi(HSPI);
MFRC522 nfc(NFC_SS, NFC_RST);
TFT_eSPI tft = TFT_eSPI();

#define BG_COLOR    0x1082
#define CARD_COLOR  0x18C3
#define ACCENT      0x6B5F
#define GREEN       0x3E89
#define RED         0xF8A6
#define YELLOW      0xFE09
#define WHITE       0xFFFF
#define GRAY        0x7BEF
#define DARK_GRAY   0x4208

unsigned long lastDisplayClear = 0;
bool showingResult = false;

void setup() {
    Serial.begin(115200);

    tft.init();
    tft.setRotation(1);
    tft.fillScreen(BG_COLOR);

    drawHeader();
    showMessage("Verbinde mit WLAN...", GRAY);

    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 40) {
        delay(500);
        attempts++;
    }

    if (WiFi.status() != WL_CONNECTED) {
        showMessage("WLAN Fehler!", RED);
        while (true) delay(1000);
    }

    hspi.begin(NFC_SCK, NFC_MISO, NFC_MOSI, NFC_SS);
    nfc.PCD_Init();

    showIdleScreen();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        showMessage("WLAN getrennt!", RED);
        WiFi.reconnect();
        delay(3000);
        return;
    }

    if (showingResult && millis() - lastDisplayClear > 5000) {
        showIdleScreen();
        showingResult = false;
    }

    if (!nfc.PICC_IsNewCardPresent() || !nfc.PICC_ReadCardSerial()) {
        delay(100);
        return;
    }

    String uid = "";
    for (byte i = 0; i < nfc.uid.size; i++) {
        if (i > 0) uid += ":";
        if (nfc.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(nfc.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    nfc.PICC_HaltA();
    nfc.PCD_StopCrypto1();

    showMessage("Verarbeite...", ACCENT);
    sendStamp(uid);
}

void sendStamp(String uid) {
    HTTPClient http;
    http.begin(String(SERVER_URL) + "/api/stamp/nfc");
    http.addHeader("Content-Type", "application/json");

    String body = "{\"nfcUid\":\"" + uid + "\",\"deviceId\":\"" + DEVICE_ID + "\"}";
    int code = http.POST(body);

    if (code != 200) {
        showMessage("Server Fehler: " + String(code), RED);
        http.end();
        showingResult = true;
        lastDisplayClear = millis();
        return;
    }

    String response = http.getString();
    http.end();

    JsonDocument doc;
    deserializeJson(doc, response);

    const char* action = doc["action"];

    if (strcmp(action, "unknown") == 0) {
        showMessage("Tag nicht zugewiesen", YELLOW);
    } else if (strcmp(action, "assigned") == 0) {
        showAssigned();
    } else if (strcmp(action, "stamped") == 0) {
        showStampResult(doc);
    }

    showingResult = true;
    lastDisplayClear = millis();
}

void drawHeader() {
    tft.fillRect(0, 0, tft.width(), 40, CARD_COLOR);
    tft.setTextColor(ACCENT);
    tft.setTextSize(2);
    tft.drawString("ZeitStempel", 10, 10);

    tft.setTextColor(GRAY);
    tft.setTextSize(1);
    tft.drawString(DEVICE_ID, tft.width() - 100, 15);
}

void clearContent() {
    tft.fillRect(0, 44, tft.width(), tft.height() - 44, BG_COLOR);
}

void showIdleScreen() {
    clearContent();
    tft.setTextColor(GRAY);
    tft.setTextSize(2);

    int centerX = tft.width() / 2;
    int centerY = tft.height() / 2;

    tft.drawCircle(centerX, centerY - 10, 30, DARK_GRAY);
    tft.drawCircle(centerX, centerY - 10, 31, DARK_GRAY);

    tft.setTextDatum(TC_DATUM);
    tft.drawString("NFC-Tag vorhalten", centerX, centerY + 30);
    tft.setTextDatum(TL_DATUM);
}

void showMessage(String msg, uint16_t color) {
    clearContent();
    tft.setTextColor(color);
    tft.setTextSize(2);
    tft.setTextDatum(MC_DATUM);
    tft.drawString(msg, tft.width() / 2, tft.height() / 2);
    tft.setTextDatum(TL_DATUM);
}

void showStampResult(JsonDocument& doc) {
    clearContent();

    bool isIn = strcmp(doc["type"], "in") == 0;
    const char* firstName = doc["user"]["firstName"];
    const char* lastName = doc["user"]["lastName"];
    const char* warning = doc["warning"] | nullptr;
    int todayMin = doc["todayMinutes"];
    int balance = doc["balance"];

    int y = 54;

    // Status bar
    uint16_t statusColor = isIn ? GREEN : RED;
    tft.fillRoundRect(10, y, tft.width() - 20, 36, 6, statusColor);
    tft.setTextColor(BG_COLOR);
    tft.setTextSize(2);
    tft.setTextDatum(MC_DATUM);
    tft.drawString(isIn ? "EINGESTEMPELT" : "AUSGESTEMPELT", tft.width() / 2, y + 18);
    tft.setTextDatum(TL_DATUM);
    y += 48;

    // Name
    tft.setTextColor(WHITE);
    tft.setTextSize(2);
    String name = String(firstName) + " " + String(lastName);
    tft.drawString(name, 14, y);
    y += 28;

    // Time
    String timeStr = doc["time"].as<String>();
    int tIdx = timeStr.indexOf('T');
    String clock = timeStr.substring(tIdx + 1, tIdx + 6);
    tft.setTextColor(GRAY);
    tft.setTextSize(2);
    tft.drawString(clock + " Uhr", 14, y);
    y += 34;

    // Divider
    tft.drawLine(14, y, tft.width() - 14, y, DARK_GRAY);
    y += 10;

    // Today hours
    int th = todayMin / 60;
    int tm = todayMin % 60;
    tft.setTextColor(GRAY);
    tft.setTextSize(1);
    tft.drawString("Heute:", 14, y);
    tft.setTextColor(WHITE);
    tft.setTextSize(2);
    char todayBuf[16];
    snprintf(todayBuf, sizeof(todayBuf), "%dh %02dmin", th, tm);
    tft.drawString(todayBuf, 80, y - 4);
    y += 28;

    // Balance
    tft.setTextColor(GRAY);
    tft.setTextSize(1);
    tft.drawString("Konto:", 14, y);

    bool neg = balance < 0;
    int absB = abs(balance);
    int bh = absB / 60;
    int bm = absB % 60;
    char balBuf[16];
    snprintf(balBuf, sizeof(balBuf), "%s%dh %02dmin", neg ? "-" : "+", bh, bm);
    tft.setTextColor(neg ? RED : GREEN);
    tft.setTextSize(2);
    tft.drawString(balBuf, 80, y - 4);
    y += 28;

    // Warning
    if (warning) {
        tft.fillRoundRect(10, y, tft.width() - 20, 28, 4, 0x4200);
        tft.setTextColor(YELLOW);
        tft.setTextSize(1);
        tft.setTextDatum(MC_DATUM);
        tft.drawString(warning, tft.width() / 2, y + 14);
        tft.setTextDatum(TL_DATUM);
    }
}

void showAssigned() {
    clearContent();
    tft.fillRoundRect(10, tft.height() / 2 - 30, tft.width() - 20, 60, 8, GREEN);
    tft.setTextColor(BG_COLOR);
    tft.setTextSize(2);
    tft.setTextDatum(MC_DATUM);
    tft.drawString("NFC-Tag zugewiesen!", tft.width() / 2, tft.height() / 2);
    tft.setTextDatum(TL_DATUM);
}
