import React, { useState, useEffect } from "react";
import { Dimensions, View, StyleSheet, Button } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Socket, io } from "socket.io-client";
import * as Location from "expo-location";
import { generateCircularPath } from "./utils/generateCircularPath";

type ClientLocation = {
  latitude: number;
  longitude: number;
};

type ClientLocationData = ClientLocation & {
  client_id: string;
};

export default function App() {
  const [location, setLocation] = useState<ClientLocation>();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [socketConnection, setSocketConnection] = useState<Socket>();
  const [sendLocation, setSendLocation] = useState<boolean>(false);
  const [racers, setRacers] = useState<ClientLocationData[]>(
    new Array<ClientLocationData>(),
  );

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation({ longitude: coords.longitude, latitude: coords.latitude });
    })();
  }, []);

  const center = location;
  const circuitPath = generateCircularPath(center, 200, 50);

  const onConnectToServer = () => {
    const connection = io("ws://192.168.1.102:3000");
    setSocketConnection(connection);
  };

  socketConnection?.on("location", (location) => {
    console.log(location);

    const newRacersData: ClientLocationData[] = new Array<ClientLocationData>();

    racers.forEach((racer) => {
      newRacersData.push(
        racer.client_id === location.client_id ? location : racer,
      );
    });

    setRacers(newRacersData);
  });

  let sendLocationInterval: NodeJS.Timeout;

  const startSendingLocation = () => {
    setSendLocation(true);
    sendLocationInterval = setInterval(() => {
      // manda location a cada 10 segundos
      socketConnection?.emit("data", location);
    }, 1000);
  };

  const stopSendingLocation = () => {
    clearInterval(sendLocationInterval);
    setSendLocation(false);
    socketConnection?.disconnect();
    setSocketConnection(undefined);
  };

  return (
    <View style={styles.container}>
      <Button
        title={
          !sendLocation ? "start sending location" : "stop sending location"
        }
        disabled={!socketConnection}
        onPress={sendLocation ? stopSendingLocation : startSendingLocation}
      />

      <Button
        title={!!socketConnection ? "connected to server" : "connect to server"}
        onPress={() => onConnectToServer()}
        disabled={!!socketConnection}
      />

      <MapView
        style={{
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height - 360,
        }}
        initialRegion={{
          latitude: location ? location.latitude : 37.78825,
          longitude: location ? location.longitude : -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Polyline
          coordinates={circuitPath}
          strokeColor="#000" // Change the color as needed
          strokeWidth={3}
        />

        {!!racers?.length &&
          racers.map((racer) => (
            <Marker
              key={racer.client_id}
              coordinate={{
                latitude: racer.latitude,
                longitude: racer.longitude,
              }}
              title={`Racer ${racer.client_id}`}
            />
          ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
});
