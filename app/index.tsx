import MyText from '@components/MyText';
import GrandezasSomaVetores from '@pages/conceitos-basicos/GrandezasSomaVetores';
import GrandezasSubtracaoDeVetores from '@pages/conceitos-basicos/GrandezasSubtracaoDeVetores';
import HomeScreen, { routesHelper } from '@pages/HomeScreen';
import React from 'react';
import { Platform } from 'react-native';
import { HashRouter, Route, Routes } from 'react-router-dom';

export default function Index() {
  return (
    <>
      {Platform.OS === "web" ?
        <HashRouter>
          <Routes>
            <Route path="/" Component={HomeScreen} />
            {
              routesHelper.map(section =>
                section.entries.map(entry => (
                  <Route
                    key={entry.url}
                    path={entry.url}
                    Component={entry.component}
                  />
                ))
              )
            }
          </Routes>
        </HashRouter>
        : <MyText>NYI Mobile routes</MyText>}
    </>
  );
}