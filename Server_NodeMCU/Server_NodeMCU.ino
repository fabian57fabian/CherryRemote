#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>

#include <ArduinoJson.h>

#include <IRremoteESP8266.h>
#include <IRsend.h>
#include <IRrecv.h>
#include <IRutils.h>

#define IR_LED 4 //D2
#define RECV_PIN 14 //D5
#define LEDPin 2 //D4
#define CAPTURE_BUFFER_SIZE 1024
#if DECODE_AC
#define TIMEOUT 50U  // Some A/C units have gaps in their protocols of ~40ms.
// e.g. Kelvinator
// A value this large may swallow repeats of some protocols
#else  // DECODE_AC
#define TIMEOUT 15U  // Suits most messages, while not swallowing many repeats.
#endif  // DECODE_AC
#define MIN_UNKNOWN_SIZE 12

IRrecv irrecv(RECV_PIN, CAPTURE_BUFFER_SIZE, TIMEOUT, true);
decode_results results;

IRsend irsend(IR_LED);


// Replace with your network credentials
const char* ssid_hotspot = "cherry_remote_wifi";
const char* password_hotspot = "cherry_remote_wifipassword";

ESP8266WebServer server(80);   //instantiate server at port 80 (http port)

String page = "";

bool blink_when_IR = true;
bool print_for_debug = true;

void setup(void) {
  //configuring the IR
  irrecv.enableIRIn();  // Start the receiver
  irsend.begin();
  if (print_for_debug) {
    Serial.begin(115200, SERIAL_8N1, SERIAL_TX_ONLY);
  }

  //make the LED pin output and initially turned off
  pinMode(LEDPin, OUTPUT);
  digitalWrite(LEDPin, LOW);

  delay(1000);
  Serial.begin(115200);
  WiFi.begin(ssid_hotspot, password_hotspot); //begin WiFi connection
  print_this("");
  int count = 0;
  // Wait for connection
  Serial.println("Try with cherry_remote_wifi");
  while (WiFi.status() != WL_CONNECTED && count < 10) {
    delay(500);
    print_this(".");
  }
  server.on("/", manage_root);
  server.on("/channel_IR", manage_send_request);
  server.begin();
  print_this("Web server started!");
}

void loop(void) {
  server.handleClient();
}

void manage_root() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/html", "<h1>Server working </h1>");
}

void send_errorAnswer(String error) {
  print_this(error);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(400, "application/json", "{result: \"ERROR: " + error + "\"}");
  return;
}

void printargs() {
  if (print_for_debug) {
    String message = "Number of args received: " + String(server.args());
    for (int i = 0; i < server.args(); i++) {
      message += "\nArg nº" + (String)i + " – > ";
      message += server.argName(i) + ": ";
      message += server.arg(i) + "";
    }
    print_this(message);
  }
}
void manage_send_request() {
  printargs();
  if (!server.hasArg("plain")) {
    send_errorAnswer("No plain received");
    return;
  }
  DynamicJsonBuffer JSONBuffer;
  JsonObject&  root = JSONBuffer.parseObject(server.arg("plain"));
  if (!root.success()) {
    send_errorAnswer("Malformed json received");
    return;
  }
  if (!root.containsKey("type")) {
    send_errorAnswer("No type received");
    return;
  }
  String type = root["type"];
  if (type == "send") {
    manage_send(root);
  } else  if (type == "access") {
    manage_access(root);
    return;
  } else  if (type == "read") {
    manage_read(root);
  } else {
    send_errorAnswer(String("Unknown type " + type));
  }
}

void manage_access(JsonObject&  root) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "json", "{\"result\":\"WORKING\"}");
  print_this("access request sent");
}

void manage_read(JsonObject&  root) {
  String res = getIrSignal();
  String ress = "{\"result\":\"OK\", " + res + "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "json", ress);
  print_this("signal readed sent");
}

void manage_send(JsonObject&  root) {
  String receiver = root["receiver"];
  if (receiver == "NEC") {
    String code = root["code"];
    irsend.sendNEC(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "RC5") {
    String code = root["code"];
    irsend.sendRC5(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "RC6") {
    String code = root["code"];
    irsend.sendRC6(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "JVC") {
    String code = root["code"];
    irsend.sendJVC(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "RCMM") {
    String code = root["code"];
    irsend.sendRCMM(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "COOLIX") {
    String code = root["code"];
    irsend.sendCOOLIX(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "WHYNTER") {
    String code = root["code"];
    irsend.sendWhynter(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "MITSUBISHI") {
    String code = root["code"];
    irsend.sendMitsubishi(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "MITSUBISHI2") {
    String code = root["code"];
    irsend.sendMitsubishi2(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "AIWA_RC_T501") {
    String code = root["code"];
    irsend.sendAiwaRCT501(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "GREE") {
    String code = root["code"];
    irsend.sendGree(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "NIKAI") {
    String code = root["code"];
    irsend.sendNikai(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "MIDEA") {
    String code = root["code"];
    irsend.sendMidea(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "MAGIQUEST") {
    String code = root["code"];
    irsend.sendMagiQuest(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "LASERTAG") {
    String code = root["code"];
    irsend.sendLasertag(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "CARRIER_AC") {
    String code = root["code"];
    irsend.sendCarrierAC(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "GICABLE") {
    String code = root["code"];
    irsend.sendGICable(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "SONY") {
    String code = root["code"];
    irsend.sendSony(strtoul(code.c_str(), NULL, 16), 32, 3);
  } else if (receiver == "SANYO") {
    String code = root["code"];
    irsend.sendSanyoLC7461(strtoul(code.c_str(), NULL, 16), 32);
  } else if (receiver == "DISH") {
    String code = root["code"];
    irsend.sendDISH(strtoul(code.c_str(), NULL, 16), 32, 3);
  } else if (receiver == "DENON") {
    String code = root["code"];
    irsend.sendDenon(strtoul(code.c_str(), NULL, 16), 32, 3);
  } else if (receiver == "SHERWOOD") {
    String code = root["code"];
    irsend.sendSherwood(strtoul(code.c_str(), NULL, 16), 32, 3);
  } else if (receiver == "UNKNOWN") {
    unsigned int sizee = root["code"].size();
    //rawblast(root["code"], 38, 1, 100, 50);

    uint16_t rawData[sizee];
    print_this("Raw code received. Size: ");
    print_this(String(sizee));
    for (int i = 0; i < sizee; i++) {
      rawData[i] = root["code"][i];
    }
    irsend.sendRaw(rawData, sizee, 38);
  }
  print_this("IR signal sent");
  blink_led();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "json", "{\"result\":\"OK\"}");
}

void rawblast(JsonArray &raw, int khz, int pulse, int pdelay, int duty) {
  for (int p = 0; p < pulse; p++) {
    for (unsigned int i = 0; i < raw.size(); i++) {
      int val = raw[i];
      if (i & 1) irsend.space(std::max(0, val));
      else       irsend.mark(val);
    }
    irsend.space(0);
    if (p + 1 < pulse) delay(pdelay);
  }
}

void print_this(String s) {
  if (print_for_debug) {
    Serial.println(s);
  }
}

void blink_led() {
  if (blink_when_IR) {
    digitalWrite(LEDPin, HIGH);
    delay(20);
    digitalWrite(LEDPin, LOW);
  }
}

String getIrSignal() {
  int max_time = 5000;
  long starttime = millis();
  String s = "";
  digitalWrite(LEDPin, HIGH);
  irrecv.resume();
  while ((millis() - starttime) <= max_time && s == "")
  {
    if (irrecv.decode(&results)) {
      String typee = get_type(&results);
      if (results.decode_type == UNKNOWN) {
        String rawData = get_raw_data(&results);
        /*
          for (int i = 0; i < results.rawlen; i++) {
          rawData += results.rawbuf[i];
          if (i < results.rawlen - 1) {
            rawData += ", ";
          }
          }
          rawData += "]";
        */
        s = "\"code\":\"" + rawData + "\",\"type\":\"" + typee + "\",\"receiver\":\"UNKNOWN\"";
      } else {
        uint64_t number = results.value;
        unsigned long long1 = (unsigned long)((number & 0xFFFF0000) >> 16 );
        unsigned long long2 = (unsigned long)((number & 0x0000FFFF));
        s = String(long1, HEX) + String(long2, HEX); // six octets
        s = "\"code\":\"" + s + "\",\"type\":\"" + typee + "\",\"receiver\":\"" + get_type(&results) + "\"";
      }
      print_this("READED: " + s);
    }
    delay(10);
  }
  digitalWrite(LEDPin, LOW);
  return s;
}

String get_raw_data(const decode_results *results) {
  String output = "[";
  for (uint16_t i = 1; i < results->rawlen; i++) {
    uint32_t usecs;
    for (usecs = results->rawbuf[i] * RAWTICK;
         usecs > UINT16_MAX;
         usecs -= UINT16_MAX) {
      output += uint64ToString(UINT16_MAX);
      if (i % 2)
        output += ", 0,  ";
      else
        output += ",  0, ";
    }
    output += uint64ToString(usecs, 10);
    if (i < results->rawlen - 1)
      output += ", ";  // ',' not needed on the last one
    if (i % 2 == 0)  output += " ";  // Extra if it was even.
  }
  output += "]";
  return output;
}

/*
  enum decode_type_t {
  UNKNOWN = -1,
  UNUSED = 0,
  RC5,
  RC6,
  NEC,
  SONY,
  PANASONIC,
  JVC,
  SAMSUNG,
  WHYNTER,
  AIWA_RC_T501,
  LG,
  SANYO,
  MITSUBISHI,
  DISH,
  SHARP,
  COOLIX,
  DAIKIN,
  DENON,
  KELVINATOR,
  SHERWOOD,
  MITSUBISHI_AC,
  RCMM,
  SANYO_LC7461,
  RC5X,
  GREE,
  PRONTO,  // Technically not a protocol, but an encoding.
  NEC_LIKE,
  ARGO,
  TROTEC,
  NIKAI,
  RAW,  // Technically not a protocol, but an encoding.
  GLOBALCACHE,  // Technically not a protocol, but an encoding.
  TOSHIBA_AC,
  FUJITSU_AC,
  MIDEA,
  MAGIQUEST,
  LASERTAG,
  CARRIER_AC,
  HAIER_AC,
  MITSUBISHI2,
  HITACHI_AC,
  HITACHI_AC1,
  HITACHI_AC2,
  GICABLE
  };
*/
String get_type(decode_results* results) {
  if (results->decode_type == UNKNOWN) {
    return "UNKNOWN";
  } else if (results->decode_type == NEC) {
    return "NEC";
  } else if (results->decode_type == SONY) {
    return "SONY";
  } else if (results->decode_type == RC5) {
    return "RC5";
  } else if (results->decode_type == RC5X) {
    return "RC5X";
  } else if (results->decode_type == RC6) {
    return "RC6";
  } else if (results->decode_type == RCMM) {
    return "RCMM";
  } else if (results->decode_type == PANASONIC) {
    return "PANASONIC";
  } else if (results->decode_type == LG) {
    return "LG";
  } else if (results->decode_type == JVC) {
    return "JVC";
  } else if (results->decode_type == AIWA_RC_T501) {
    return "AIWA_RC_T501";
  } else if (results->decode_type == WHYNTER) {
    return "WHYNTER";
  } else if (results->decode_type == SHERWOOD) {
    return "SHERWOOD";
  } else if (results->decode_type == DENON) {
    return "DENON";
  } else if (results->decode_type == SAMSUNG) {
    return "SAMSUNG";
  } else if (results->decode_type == COOLIX) {
    return "COOLIX";
  } else if (results->decode_type == MITSUBISHI) {
    return "MITSUBISHI";
  } else if (results->decode_type == MITSUBISHI2) {
    return "MITSUBISHI2";
  } else if (results->decode_type == GREE) {
    return "GREE";
  } else if (results->decode_type == MIDEA) {
    return "MIDEA";
  } else if (results->decode_type == MAGIQUEST) {
    return "MIGIQUEST";
  } else if (results->decode_type == LASERTAG) {
    return "LASERTAG";
  } else if (results->decode_type == CARRIER_AC) {
    return "CARRIER_AC";
  } else if (results->decode_type == GICABLE) {
    return "GICABLE";
  } else if (results->decode_type == SANYO) {
    return "SANYO";
  } else if (results->decode_type == DISH) {
    return "DISH";
  } else if (results->decode_type == NIKAI) {
    return "NIKAI";
  }
}

char* uint64_to_string(uint64_t input)
{
  static char result[21] = "";
  // Clear result from any leftover digits from previous function call.
  memset(&result[0], 0, sizeof(result));
  // temp is used as a temporary result storage to prevent sprintf bugs.
  char temp[21] = "";
  char c;
  uint8_t base = 10;

  while (input)
  {
    int num = input % base;
    input /= base;
    c = '0' + num;

    sprintf(temp, "%c%s", c, result);
    strcpy(result, temp);
  }
  return result;
}

