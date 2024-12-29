/**
  Licensed to the Apache Software Foundation (ASF) under one
  or more contributor license agreements.  See the NOTICE file
  distributed with this work for additional information
  regarding copyright ownership.  The ASF licenses this file
  to you under the Apache License, Version 2.0 (the
  "License"); you may not use this file except in compliance
  with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied.  See the License for the
  specific language governing permissions and limitations
  under the License.

 *******************************************************************************
 * @file main_core.c
 * @author Ânderson Ignacio da Silva
 * @date 19 Ago 2016
 * @brief Main code to test MQTT-SN on Contiki-OS
 * @see http://www.aignacio.com
 * @license This project is licensed by APACHE 2.0.
 */

#include "contiki.h"
#include "lib/random.h"
#include "clock.h"
#include "sys/ctimer.h"
#include "net/ip/uip.h"
#include "net/ipv6/uip-ds6.h"
#include "mqtt_sn.h"
#include "dev/leds.h"
#include "net/rime/rime.h"
#include "net/ip/uip.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>


static uint16_t udp_port = 1884;
static uint16_t keep_alive = 5;
static uint16_t broker_address[] = {0xaaaa, 0, 0, 0, 0, 0, 0, 0x1};
static struct   etimer time_poll;
// static uint16_t tick_process = 0;
static char     pub_test[20];
static char     device_id[17];
static char     topic_hw[25];
static char     *topics_mqtt[] = {"/t2"};
// static char     *will_topic = "/6lowpan_node/offline";
// static char     *will_message = "O dispositivo esta offline";
// This topics will run so much faster than others


mqtt_sn_con_t mqtt_sn_connection;
struct Request {
    char *topic;
    char *message;
};


void mqtt_sn_callback(char *topic, char *message) {
    // printf("Message received:");

    if (strcmp(topic, "/t2") == 0) {
        // if (strlen(message) > 1) {
            printf("Message receive: %s \r\n", message);
    }
    //     } else if (strlen(message) == 1) {
    //         if (isdigit(message[0])) {  // Check if the single character is a digit
    //             int check = atoi(message);
    //             switch (check) {
    //                 case 0:
    //                     leds_off(LEDS_GREEN);
    //                     leds_off(LEDS_YELLOW);
    //                     leds_off(8);
    //                     printf("Led Off All \r\n");
    //                     break;
    //                 case 1:
    //                     leds_on(LEDS_GREEN);
    //                     leds_off(LEDS_YELLOW);
    //                     leds_off(8);
    //                     printf("Led Red On \r\n");
    //                     break;
    //                 case 2:
    //                     leds_off(LEDS_GREEN);
    //                     leds_on(LEDS_YELLOW);
    //                     leds_off(8);
    //                     printf("Led Green On \r\n");
    //                     break;
    //                 case 3:
    //                     leds_off(LEDS_GREEN);
    //                     leds_off(LEDS_YELLOW);
    //                     leds_on(8);
    //                     printf("Led Blue On \r\n");
    //                     break;
    //                 case 4:
    //                     leds_on(LEDS_GREEN);
    //                     leds_on(LEDS_YELLOW);
    //                     leds_off(8);
    //                     printf("Led Red-Green On \r\n");
    //                     break;
    //                 case 5:
    //                     leds_on(LEDS_GREEN);
    //                     leds_off(LEDS_YELLOW);
    //                     leds_on(8);
    //                     printf("Led Red-Blue On \r\n");
    //                     break;
    //                 case 6:
    //                     leds_off(LEDS_GREEN);
    //                     leds_on(LEDS_YELLOW);
    //                     leds_on(8);
    //                     printf("Led Green-Blue On \r\n");
    //                     break;
    //                 case 7:
    //                     leds_on(LEDS_GREEN);
    //                     leds_on(LEDS_YELLOW);
    //                     leds_on(8);
    //                     printf("Led All On \r\n");
    //                     break;
    //                 default:
    //                     printf("Invalid single-character command: %s\r\n", message);
    //                     break;
    //             }
    //         } else {
    //             printf("Received invalid single-character input: %s\r\n", message);
    //         }
    //     } else {
    //         printf("Message is empty.\r\n");
    //     }
    // }
}


void init_broker(void){
  char *all_topics[ss(topics_mqtt)+1];
  sprintf(device_id,"%02X%02X%02X%02X%02X%02X%02X%02X",
          linkaddr_node_addr.u8[0],linkaddr_node_addr.u8[1],
          linkaddr_node_addr.u8[2],linkaddr_node_addr.u8[3],
          linkaddr_node_addr.u8[4],linkaddr_node_addr.u8[5],
          linkaddr_node_addr.u8[6],linkaddr_node_addr.u8[7]);
  // sprintf(topic_hw,"Hello addr:%02X%02X",linkaddr_node_addr.u8[6],linkaddr_node_addr.u8[7]);

  mqtt_sn_connection.client_id     = device_id;
  mqtt_sn_connection.udp_port      = udp_port;
  mqtt_sn_connection.ipv6_broker   = broker_address;
  mqtt_sn_connection.keep_alive    = keep_alive;
  //mqtt_sn_connection.will_topic    = will_topic;   // Configure as 0x00 if you don't want to use
  //mqtt_sn_connection.will_message  = will_message; // Configure as 0x00 if you don't want to use
  mqtt_sn_connection.will_topic    = 0x00;
  mqtt_sn_connection.will_message  = 0x00;

  mqtt_sn_init();   // Inicializa alocação de eventos e a principal PROCESS_THREAD do MQTT-SN

  size_t i;
  for(i=0;i<ss(topics_mqtt);i++)
    all_topics[i] = topics_mqtt[i];
  // all_topics[i] = topic_hw;

  mqtt_sn_create_sck(mqtt_sn_connection,
                     all_topics,
                     ss(all_topics),
                     mqtt_sn_callback);
  mqtt_sn_sub("/t1",0);
}

/*---------------------------------------------------------------------------*/ 
PROCESS(init_system_process, "[Contiki-OS] Initializing OS");
AUTOSTART_PROCESSES(&init_system_process);
/*---------------------------------------------------------------------------*/

PROCESS_THREAD(init_system_process, ev, data) {
  PROCESS_BEGIN();

  debug_os("Initializing the MQTT_SN_DEMO");

  leds_init();
  init_broker();
   // printf("Here");
   //etimer_set(&time_poll, 60*CLOCK_SECOND);

  while(1) {
    PROCESS_WAIT_EVENT();

  //   if (ev == PROCESS_EVENT_TIMER){
   //   mqtt_sn_pub("/t2","hello ",true,0);
      // debug_os("State MQTT:%s",mqtt_sn_check_status_string());
  //    if (etimer_expired(&time_poll))
   //      etimer_reset(&time_poll);
     //}
      // sprintf(pub_test,"%s",topic_hw);
      // mqtt_sn_pub("/t5","hello",true,0);
      // // debug_os("State MQTT:%s",mqtt_sn_check_status_string());
      // if (etimer_expired(&time_poll))
      //   etimer_reset(&time_poll);
  }
  PROCESS_END();
}


