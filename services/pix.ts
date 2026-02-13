
export class Pix {
  private static formatField(id: string, value: string): string {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  }

  private static crc16(buffer: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < buffer.length; i++) {
      crc ^= buffer.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  public static payload(params: {
    key: string;
    name: string;
    city: string;
    amount: number;
    txid?: string;
    description?: string;
  }): string {
    const { key, name, city, amount, txid = '***', description } = params;
    
    // Normalize text (remove accents)
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);

    const safeName = normalize(name || 'Recebedor');
    const safeCity = normalize(city || 'Cidade');
    const safeKey = key;
    const amountStr = amount.toFixed(2);

    // 00 - Payload Format Indicator
    // 26 - Merchant Account Information (GUI, Chave, Description)
    // 52 - Merchant Category Code
    // 53 - Transaction Currency
    // 54 - Transaction Amount
    // 58 - Country Code
    // 59 - Merchant Name
    // 60 - Merchant City
    // 62 - Additional Data Field Template (TxID)
    
    let merchantAccount = '';
    merchantAccount += Pix.formatField('00', 'BR.GOV.BCB.PIX');
    merchantAccount += Pix.formatField('01', safeKey);
    if (description) {
        merchantAccount += Pix.formatField('02', normalize(description));
    }

    let payload = '';
    payload += Pix.formatField('00', '01'); // Version
    payload += Pix.formatField('26', merchantAccount);
    payload += Pix.formatField('52', '0000'); // MCC
    payload += Pix.formatField('53', '986'); // BRL
    payload += Pix.formatField('54', amountStr);
    payload += Pix.formatField('58', 'BR');
    payload += Pix.formatField('59', safeName);
    payload += Pix.formatField('60', safeCity);
    
    let additionalData = '';
    additionalData += Pix.formatField('05', txid);
    payload += Pix.formatField('62', additionalData);

    // CRC16 Calculation
    payload += '6304';
    payload += Pix.crc16(payload);

    return payload;
  }
}
