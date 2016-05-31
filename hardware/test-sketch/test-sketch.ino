#include <Metro.h>

Metro buttonCheckTimer = Metro( 50 );
Metro pauseFlash = Metro( 250 );
Metro playFlash = Metro( 1000 );

#define numBtns 2

#define OFFLINE 0
#define READY 1
#define PLAYING 2
#define PAUSED 3

int state = OFFLINE;
int focusLED = -1;
boolean focusLEDstate = LOW;

int buttons[] = { 2, 3 };
int leds[] = { 13, 12 };

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
      if ( playFlash.check() ) focusLEDstate = ! focusLEDstate;
      for ( int i = 0; i < numBtns; i++ ) digitalWrite( leds[i], i != focusLED ? LOW : focusLEDstate  );
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


