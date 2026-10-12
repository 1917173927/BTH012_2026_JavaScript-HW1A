FROM public.ecr.aws/docker/library/node:23

WORKDIR /app

# Replace this URL if you use a different public GitHub repository.
RUN git clone https://github.com/1917173927/BTH012_2026_JavaScript-HW1A.git .

ENTRYPOINT ["node", "src/index.js"]
