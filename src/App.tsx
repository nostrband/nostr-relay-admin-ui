import { Container, Row, Col } from "react-bootstrap";
import Home from "./pages/Home/Home";
import { useLayoutEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks/redux";
import { userSlice } from "./store/reducers/UserSlice";

function App() {
  const { ndk } = useAppSelector((store) => store.connectionReducer);
  useLayoutEffect(() => {
    ndk.connect();
  }, []);

  return (
    <Container>
      <Row className="justify-content-lg-center">
        <Col lg={9}>
          <h3>Nostr Dashboard</h3>
          <Routes>
            <Route path="/" element={<Home ndk={ndk} />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
