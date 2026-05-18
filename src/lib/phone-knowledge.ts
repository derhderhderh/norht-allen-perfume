export function answerPhoneQuestion(input: string) {
  const text = input.toLowerCase();

  if (text.includes("refund") || text.includes("return") || text.includes("damaged")) {
    return "Custom fragrance orders are final sale. A refund can only be considered if the item arrived damaged, and the damaged item must be returned according to the refund policy. Please email contact at north allen perfumery dot org with photos and your order information.";
  }

  if (text.includes("ship") || text.includes("delivery") || text.includes("arrive") || text.includes("tracking")) {
    return "Most custom orders move through production first, then ship when blending and packaging are complete. After an order is shipped, expected arrival is usually within one to two weeks. You can check your order status from the phone menu with your six digit confirmation code.";
  }

  if (text.includes("price") || text.includes("cost") || text.includes("how much")) {
    return "Pricing depends on bottle size, scent strength, and the number of selected notes. The custom perfume builder shows the live estimate before checkout.";
  }

  if (text.includes("note") || text.includes("scent") || text.includes("fragrance") || text.includes("cologne")) {
    return "North Allen Perfumery creates custom perfume and cologne from top, heart, and base notes. Top notes open the fragrance, heart notes shape its body, and base notes give depth and longevity.";
  }

  if (text.includes("contact") || text.includes("email") || text.includes("help") || text.includes("support")) {
    return "You can reach the studio at contact at north allen perfumery dot org. Messages are handled through the admin inbox so the conversation stays organized.";
  }

  if (text.includes("local") || text.includes("north texas") || text.includes("appointment")) {
    return "North Allen Perfumery is a local boutique fragrance studio serving North Texas online, with custom blending by appointment and online order.";
  }

  return "North Allen Perfumery is an online custom perfume and cologne studio. Customers choose bottle size, scent strength, and fragrance notes to create a personal scent. For order status, use option one from the main menu with your six digit confirmation code. For more help, email contact at north allen perfumery dot org.";
}
