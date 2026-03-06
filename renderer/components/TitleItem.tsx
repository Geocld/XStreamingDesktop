import React from "react";
import { Card, Image } from "@heroui/react";

function TitleItem(props) {
  const titleItem = props.title || { name: "" };

  const handleClick = () => {
    props.onClick && props.onClick(titleItem);
  };

  let isSupportMKB = false;

  if (titleItem.details && titleItem.details.supportedInputTypes) {
    if (titleItem.details.supportedInputTypes.indexOf("MKB") > -1) {
      isSupportMKB = true;
    }
  }

  if (!titleItem.ProductTitle) return null;

  return (
    <Card
      isPressable
      className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#0A0A0B] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_0_30px_rgba(26,201,84,0.3)] hover:ring-2 hover:ring-primary shadow-lg border border-white/5"
      onClick={handleClick}
    >
      {titleItem.Image_Poster && (
        <Image
          removeWrapper
          alt={titleItem.ProductTitle}
          className="z-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          src={"https:" + titleItem.Image_Poster.URL}
        />
      )}

      {/* Badges - Sleek Glassmorphism */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-80 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-sm">
          <Image src={"/images/icons/gamepad.svg"} alt="gamepad" width={16} height={16} className="brightness-200 invert" />
        </div>
        {isSupportMKB && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-sm">
            <Image src={"/images/icons/keyboard-mouse.svg"} alt="mkb" width={16} height={16} className="brightness-200 invert" />
          </div>
        )}
      </div>

      {/* Bottom Gradient and Title */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 pt-16 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col justify-end pointer-events-none transition-all duration-300">
        <h3 className="text-sm font-bold text-white/95 leading-tight drop-shadow-md line-clamp-2 pb-1">
          {titleItem.ProductTitle}
        </h3>
        {titleItem.PublisherName && (
          <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider line-clamp-1">{titleItem.PublisherName}</p>
        )}
      </div>
    </Card>
  );
}

export default TitleItem;
