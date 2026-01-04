fn main() -> Result<(), Box<dyn std::error::Error>> {
    // proto/f1.proto 파일을 컴파일하여 Rust 코드로 생성
    tonic_build::compile_protos("../proto/f1.proto")?; 
    
    Ok(())
}