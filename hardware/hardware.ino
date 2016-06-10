#include <Metro.h>

Metro buttonCheckTimer = Metro( 50 );
Metro pauseFlash = Metro( 250 );

#define numBtns 20

#define OFFLINE 0
#define READY 1
#define PLAYING 2
#define PAUSED 3

int state = OFFLINE;
int focusLED = -1;
boolean focusLEDstate = LOW;

//                01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
int buttons[] = { 53, 51, 49, 47, 45, 43, 41, 39, 37, 35, 33, 31, 29, 27, 25, 23, 21, 19, 17, 15 };
int leds[] =    { 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14 };

void setup() {
  Serial.begin( 115200 );
  for ( int i = 0; i < numBtns; i++ )
    pinMode( buttons[i], INPUT_PULLUP );

  for ( int i = 0; i < numBtns; i++ )
    pinMode( leds[i], OUTPUT );
}

void loop() {
  // Check inputs
  if ( buttonCheckTimer.check() )
    for ( int i = 0; i < numBtns; i++ )
      if ( ! digitalRead( buttons[i] ) ) {
        Serial.println( padInt( i + 1 ) );
        delay( 250 );
      }

  // Handle modes for LEDs
  switch ( state ) {
    case OFFLINE:
      for ( int i = 0; i < numBtns; i++ )
        digitalWrite( leds[i], LOW );
      break;
    case READY:
      for ( int i = 0; i < numBtns; i++ )
        digitalWrite( leds[i], HIGH );
      break;
    case PLAYING:
      for ( int i = 0; i < numBtns; i++ ) digitalWrite( leds[i], i != focusLED ? LOW : HIGH );
      break;
    case PAUSED:
      if ( pauseFlash.check() ) focusLEDstate = ! focusLEDstate;
      for ( int i = 0; i < numBtns; i++ ) digitalWrite( leds[i], i != focusLED ? LOW : focusLEDstate  );
      break;
  }
  
  if ( Serial.available() ) {
    byte first_byte = Serial.read();
    int ten, one;
    
    switch ( first_byte ) {
      case 'O':
        state = OFFLINE;
        break;
      case 'R':
        state = READY;
        break;
      case 'P':
        state = PLAYING;
        while ( Serial.available() < 2 ) {}
        ten = ( Serial.read() - '0' ) * 10;
        one = Serial.read() - '0';
        focusLED = ( ten + one ) - 1;
        break;
      case 'S':
        state = PAUSED;
        while ( Serial.available() < 2 ) {}
        ten = ( Serial.read() - '0' ) * 10;
        one = Serial.read() - '0';
        focusLED = ( ten + one ) - 1;
        break;
      
    }
  }
}

String padInt( int input ) {
  String output = String( input );
  if ( input < 10 )
    output = "0" + output;
  return output;
}


