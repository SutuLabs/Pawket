class PawketChiaApi {

  public getAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
      const event = new CustomEvent("chia.getAddress.request");
      document.dispatchEvent(event);
      document.addEventListener("chia.getAddress.response", function (event) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resp = (event as any).detail;
        if (!resp || !resp.ok)
          reject(resp?.error ?? "Unknown error");
        resolve(resp.address);
      });
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).chia = new PawketChiaApi();
