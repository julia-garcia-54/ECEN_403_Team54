
//Blake Bagley Remote Viewing System Code

/*----------------------------------------------------------------
This code has three key functions for the system:

1. Connect to device through WiFi

2. Read picture data from the thermal imager

3. Use image processing to determine if switch is open or closed
----------------------------------------------------------------*/

//
#include <stdio.h>
#include <math.h>
#include "sdkconfig.h"
#include "esp_wifi.h"
#include "nvs_flash.h"
#include "driver/spi_master.h"
#include "esp_log.h"
#include <string.h>
#include "driver/gpio.h"
#include "esp_rom_sys.h"
#include "esp_heap_caps.h"
#include "esp_heap_caps_init.h"

//GPIO Pin Definitions
#define CS_PIN         9      
#define SCLK_PIN       39      
#define MOSI_PIN       35
#define MISO_PIN       14


void app_main(void)
{
    
    printf("Initializing: \n");



//---------------SPI CONFIGURATION--------------------//

    spi_device_handle_t Lepton;

    spi_bus_config_t pins = { //GPIO pins
        .mosi_io_num = MOSI_PIN,
        .miso_io_num = MISO_PIN,
        .sclk_io_num = SCLK_PIN,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1};

    
    spi_device_interface_config_t lepton_config = { //Communication configuration
        .command_bits = 0,
        .address_bits = 0,
        .dummy_bits = 0,
        .clock_speed_hz = 20000000,                 //20 MHz
        .duty_cycle_pos = 128,                      // 50% duty cycle
        .mode = 3,                                  //VSPI
        .spics_io_num = CS_PIN,                     //CS
        .queue_size = 1};

    spi_bus_initialize(SPI3_HOST, &pins, SPI_DMA_CH_AUTO);

    spi_bus_add_device(SPI3_HOST, &lepton_config, &Lepton);

//----------------------------------------------------//




//----------------CAMERA DATA MEMORY----------------------//
    
    char* packet = (char*)malloc(164 * sizeof(char));                       //buffer for video packet

    char **frame = heap_caps_malloc(240 * sizeof(char*), MALLOC_CAP_8BIT);  //Total Frame Data
    
    for (int i = 0; i < 240; i++) {
        frame[i] = heap_caps_malloc(164 * sizeof(char), MALLOC_CAP_8BIT);
    }

    int **Nframe = heap_caps_malloc(120 * sizeof(int*), MALLOC_CAP_8BIT);   //Total Normalized Frame Data
    
    for (int i = 0; i < 120; i++) {
        Nframe[i] = heap_caps_malloc(160 * sizeof(int), MALLOC_CAP_8BIT);
    }

    bool segment[4] = {false};                                              //array telling if a segment as been stored into frame

//--------------------------------------------------------//


    //Initialize buffer
    spi_transaction_t receive;
    memset(&receive, 0, sizeof(receive));   //set buffer to default settings
    receive.length = 164 * 8;               //size of buffer
    receive.rx_buffer = packet;             //sets buffer to be the stored packet
    

    //Syncs Communication
    gpio_set_level(CS_PIN, 1);              //Deassert Chip Select
    gpio_set_level(SCLK_PIN, 1);            //Idle Serial Clock
    vTaskDelay(1100 / portTICK_PERIOD_MS);
    

    printf("Initialized: \n");
    printf("GOOOOOOOOOOOOOOOOO!!!!!!!!!!!!!!!\n\n");

    int index = 0; // index of frame to be read


//-------------------------------SET UP WIFI----------------------------------------//

   nvs_flash_init();

   esp_netif_init();					
   esp_event_loop_create_default();
   
   //Initialize WiFi
   wifi_init_config_t wifi_initialize_info = WIFI_INIT_CONFIG_DEFAULT();
   esp_wifi_init(&wifi_initialize_info);
   

   esp_wifi_set_mode(WIFI_MODE_AP); // Set to Access Point
   
   //Set WiFi Configurations
   wifi_config_t WiFi_Info = {.ap = {.ssid = "Thermal Camera 1", .max_connection = 1, .channel = 0, .ssid_hidden = 0}}; 
   esp_wifi_set_config(WIFI_IF_AP, &WiFi_Info);

   esp_wifi_start(); //Start WiFi
   
   vTaskDelay(10000 / portTICK_PERIOD_MS);

//----------------------------------------------------------------------------------//


//-------------------------------READ FRAME----------------------------------------//
/*
    This section works in this order:
    1. The first packet of the frame will be read. If it is a discard packet and/or not the starting packet,
            the code will loop until it reads the first packet correctly and store it's value in the frame array.

    2. Once it reads the first packet in, a loop of length 60 will run using the same checks and reads including a
            segment check. If the segment or packet IDs read bad, the storing of the frame is reset. For each segment,
            when one is stored the code will track all of the segments that have been stored into the frame.

    3. Once all segments have been read, the reading of the frame will end.
*/

    while(segment[0] != true || segment[1] != true || segment[2] != true || segment[3] != true){

        int segmentIndex = 0;                                       //index of current segement
        bool badSegment = false;
        

        spi_device_transmit(Lepton, &receive);                      //read for first row in segment
        if(((int)packet[0] != 15 && (int)packet[0] != 31 && (int)packet[0] != 63 && (int)packet[0] != 127 && (int)packet[0] != 255) && (int)packet[1] == 0){ //checks for discard frames            
            memcpy(frame[index], packet, 164 * sizeof(char));       //store first row
            index++;               
            segmentIndex++;

            while(segmentIndex < 60)                                //stores the rest of the segment
            {   
                spi_device_transmit(Lepton, &receive);              //reads for rows
                if(((int)packet[0] != 15 && (int)packet[0] != 31 && (int)packet[0] != 63 && (int)packet[0] != 127 && (int)packet[0] != 255) && (int)packet[1] < 60){ //checks for discard frames
                    
                    if(((int)packet[1] != segmentIndex && ((int)packet[1] != 0  || segmentIndex != 60)) && !badSegment){                            
                        printf("BAD FRAME!!! %d != %d\n\n", (int)packet[1], segmentIndex);                       
                    }

                    if(segmentIndex == 20){                         //Checks which segment is read
                        printf("SEGMENT ID: %d , %d\n\n", (int)packet[0], (int)packet[1]);

                        if((int)packet[0] == 16){                   // Segment 1
                            segment[0] = true;
                        }
                        else if((int)packet[0] == 32){              // Segment 2
                            segment[1] = true;
                        }
                        else if((int)packet[0] == 48){              // Segment 3
                            segment[2] = true;
                        }
                        else if((int)packet[0] == 64){              // Segment 4
                            segment[3] = true;
                        }
                        else{                                       // Bad Segment
                            badSegment = true;
                        }
                    }
                    
                    memcpy(frame[index], packet, 164 * sizeof(char)); //stores rows
                    index++;
                    segmentIndex++;                       
                }
            }
            if(badSegment){                                           //resets frame for bad reading
                index = 0;
                memset(segment, false, sizeof(segment));
            }
        }
    }

//-----------------------------------------------------------------------//



//------------------------Switch State Determination---------------------//
/*
1. The first thing done is the code will sift through the stored frame and determine the maximum and minimum 
    pixel values on the entire frame.

2. Then, the code will use the values found in the previous step to create a normalized version of the frame
    having the values range from 0 to 255.

3. Finally, the code will find the average intensity of the entire frame and the average intensity of an
    area of pixels where the contact of the switch can be located. It will then compare the two averages
    to determine if the switch is in one state or the other.
*/

int rowSum = 0;                                                 //sum of pixel values in a row
float frameAvg = 0;                                             //average value of pixels in a frame


int checkSum = 0;                                               //sum of pixel vaues in the window of check
float checkAvg = 0;                                             //average value of pixels in the window of check

float minHeat = ((int)frame[0][4] * 128) + (int)frame[0][5];    //initialized to first pixel value
float maxHeat = minHeat;                                    
float currHeat = 0;                                             //heat value of current pixel


//Find MIN and MAX of Pixel intensity
for(int j = 0; j < 240; j += 1){
    for(int i = 4; i < 163; i += 2){
        currHeat = ((float)frame[j][i] * 128) + (float)frame[j][i+1];   //converts pixel data to one float value
        if(currHeat < minHeat){                                         //finds minimum
            minHeat = currHeat;
        }
        if(currHeat > maxHeat){                                         //finds maximum
            maxHeat = currHeat;
        }
    }
}

int side = 0; //0 means left
int sideCheck = 0; //checks which side the current packet is on

//Converts original frame data to 8-bit numbers
for(int j = 0; j < 240; j += 1){
    for(int i = 4; i < 163; i += 2){
        currHeat = ((float)frame[j][i] * 128) + (float)frame[j][i+1];                       //converts pixel data to one float value
             
        if(sideCheck == 0){
            Nframe[j/2][(i-4)/2] = (currHeat - minHeat) * (255/(maxHeat-minHeat));          //converts values to range from 0-255 (left side of row)
            side = 1;
        }
        else if(sideCheck == 1){      
            Nframe[(j-1)/2][((i-4)/2)+80] = (currHeat - minHeat) * (255/(maxHeat-minHeat)); //converts values to range from 0-255 (right side of row)
            side = 0;
        }
    }
    sideCheck = side; 
}

// Average for frame
for(int j = 0; j < 120; j += 1){
    for(int i = 4; i < 160; i += 2){
        
        rowSum += Nframe[j][i];
    }
}
frameAvg = rowSum/(240 * 80);


// Average for window of check
int pixel = 0;                          //# of pixels in window
for(int j = 24; j < 37 ; j += 1){
    for(int i = 58; i < 72; i += 1){
        checkSum += Nframe[j][i];       //adds all pixel values
        pixel++;
    }
}
checkAvg = checkSum/(pixel);            //calculates average

printf("Frame Average: %f \n", frameAvg);
printf("Check Average: %f \n", checkAvg);

//compares averages to determine switch state
if(checkAvg - frameAvg >  60){
    printf("SWITCH STATE 1 \n");
}
else{
    printf("SWITCH STATE 2 \n");
}

//--------------------------------------------------------------------//


//-------------------------Freeing Memory-----------------------------//

for (int i = 0; i < 240; i++) { //Frees Frame Storage
    heap_caps_free(frame[i]);
}
heap_caps_free(frame);

for (int i = 0; i < 120; i++) { //Frees Normalized Frame Storage
    heap_caps_free(Nframe[i]);
}
heap_caps_free(Nframe);

free(packet);                   //Frees Packet Storage

}

//-------------------------------------------------------------------//
