export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-2xl">2025</span>
        </div>
        <h1 className="sr-only">Đại hội Công giáo Việt Nam tại Nhật Bản 2025</h1>
        <div className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
          Đại hội{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Công giáo Việt Nam
          </span>{" "}
          tại Nhật Bản 2025
        </div>
      </div>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 via-50% to-transparent" />
      <div className="flex flex-col gap-8 max-w-4xl mx-auto text-center">
        <h2 className="text-xl lg:text-2xl font-light">
          <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Cùng nhau xây dựng cộng đồng Công giáo Việt Nam tại Nhật Bản vững mạnh và đoàn kết
          </span>
        </h2>
        <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
          Tham gia Đại hội để gặp gỡ, chia sẻ kinh nghiệm và cùng nhau phát triển đời sống đức tin trong cộng đồng người Việt tại Nhật Bản.
        </p>
      </div>
    </div>
  );
}
