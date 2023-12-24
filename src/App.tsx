import { Container, Row, Col } from "react-bootstrap";
import Home from "./pages/Home/Home";

function App() {
  return (
  <Container>
    <Row className="justify-content-lg-center">
      <Col lg={9}>
        <Home />
      </Col>
    </Row>
  </Container>
  );
}

export default App;
