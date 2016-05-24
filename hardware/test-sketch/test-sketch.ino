void setup() {
  Serial.begin( 115200 );
  pinMode( 2, INPUT_PULLUP );
  pinMode( 3, INPUT_PULLUP );
}

void loop() {
  delay( 250 );
  if ( ! digitalRead( 2 ) ) {
    Serial.println( "01" );
  }
  if ( ! digitalRead( 3 ) ) {
    Serial.println( "02" );
  }
}
