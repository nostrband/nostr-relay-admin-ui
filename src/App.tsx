import { Container, Row, Col } from "react-bootstrap";
import Home from "./pages/Home/Home";
import { useLayoutEffect, useState } from "react";
import NDK from "@nostrband/ndk";
import { Route, Routes } from "react-router-dom";

function App() {
  const [ndk, setNdk] = useState<NDK | null>(null);
  useLayoutEffect(() => {
    const ndk = new NDK({ explicitRelayUrls: ["wss://relay.nostr.band"] });
    ndk.connect();
    setNdk(ndk);
  }, []);

  return (
    <Container>
      <Row className="justify-content-lg-center">
        <h3>Nostr Dashboard</h3>
        <Col lg={9}>
          <Routes>
            <Route path="/" element={<Home ndk={ndk} />} />
          </Routes>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
